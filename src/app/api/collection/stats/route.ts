import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Fetch user's inventory
    const { data: items, error: itemsError } = await supabase
      .from('user_collection')
      .select('game_id, condition_state, region, purchase_price, acquired_at')
      .eq('user_id', userId);

    if (itemsError) {
      console.error('Error fetching user_collection:', itemsError);
      return NextResponse.json([]); // Graceful fallback to avoid breaking the frontend
    }

    if (!items || items.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch all historical prices for the games in the collection
    const gameIds = items.map(item => item.game_id);
    const { data: prices, error: pricesError } = await supabase
      .from('historical_prices')
      .select('game_id, condition_state, region, market_price_cleaned, recorded_date')
      .in('game_id', gameIds)
      .order('recorded_date', { ascending: true });

    if (pricesError) {
      console.error('Error fetching historical_prices:', pricesError);
      return NextResponse.json([]); // Graceful fallback to avoid breaking the frontend
    }

    const pricesList = prices || [];

    // 3. Generate last 12 months in UTC to avoid timezone issues
    const monthsList: Array<{ label: string; year: number; month: number; endOfDate: Date }> = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      const monthIdx = d.getUTCMonth();
      const year = d.getUTCFullYear();
      const label = MONTH_NAMES[monthIdx];
      
      const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
      monthsList.push({
        label,
        year,
        month: monthIdx,
        endOfDate: lastDay
      });
    }

    // 4. Calculate total portfolio value for each month
    const result = monthsList.map(month => {
      // Find games owned in this month (comparison is done via epoch timestamps, timezone-independent)
      const ownedItems = items.filter(item => new Date(item.acquired_at) <= month.endOfDate);

      let valorTotal = 0;

      for (const ownedItem of ownedItems) {
        // Find latest price in pricesList on or before this month's endOfDate
        let itemPrice = ownedItem.purchase_price ? Number(ownedItem.purchase_price) : 0;
        
        for (let pIdx = pricesList.length - 1; pIdx >= 0; pIdx--) {
          const p = pricesList[pIdx];
          if (
            p.game_id === ownedItem.game_id &&
            p.condition_state === ownedItem.condition_state &&
            p.region === ownedItem.region &&
            new Date(p.recorded_date + 'T23:59:59Z') <= month.endOfDate
          ) {
            itemPrice = Number(p.market_price_cleaned);
            break;
          }
        }

        valorTotal += itemPrice;
      }

      return {
        fecha: month.label,
        valorTotal: parseFloat(valorTotal.toFixed(2))
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Unhandled error in collection stats route:', error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}
