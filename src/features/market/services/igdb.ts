"use server";

const IGDB_URL = "https://api.igdb.com/v4/games";

export async function searchGamesIGDB(query: string) {
  if (!query) return [];

  const response = await fetch(IGDB_URL, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN!}`,
      "Accept": "application/json",
    },
    
    body: `search "${query}"; where (platforms.generation <= 7 | first_release_date < 1356998400) & parent_game = null; fields name, cover.url, platforms.name, first_release_date; limit 10;`,
    
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    console.error("IGDB Error:", await response.text());
    throw new Error("Error al consultar IGDB");
  }

  const data = await response.json();
  
  
  
  return data.map((game: any) => ({
    id: game.id,
    name: game.name,
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
    platforms: game.platforms?.map((p: any) => p.name) || [],
    coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null
  }));
}

export async function getGameByIdIGDB(gameId: number) {
  if (!gameId) return null;

  const response = await fetch(IGDB_URL, {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID!,
      "Authorization": `Bearer ${process.env.IGDB_ACCESS_TOKEN!}`,
      "Accept": "application/json",
    },
    body: `where id = ${gameId}; fields name, cover.url, platforms.name, first_release_date;`,
  });

  if (!response.ok) {
    console.error("IGDB ID Lookup Error:", await response.text());
    return null;
  }

  const data = await response.json();
  if (data && data.length > 0) {
    const game = data[0];
    return {
      id: game.id,
      name: game.name,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
      platforms: game.platforms?.map((p: any) => p.name) || [],
      coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null
    };
  }
  return null;
}
