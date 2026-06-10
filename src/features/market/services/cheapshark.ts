"use server";

const CHEAPSHARK_URL = "https://www.cheapshark.com/api/1.0";

export async function searchModernGameDeals(title: string) {
  if (!title) return [];

  
  const response = await fetch(`${CHEAPSHARK_URL}/games?title=${encodeURIComponent(title)}&limit=5`, {
    next: { revalidate: 3600 } 
  });
  
  if (!response.ok) {
    throw new Error("Error al consultar CheapShark");
  }

  const data = await response.json();
  return data;
}

export async function getGameDealsById(cheapSharkGameId: string) {
  if (!cheapSharkGameId) return null;

  
  const response = await fetch(`${CHEAPSHARK_URL}/games?id=${cheapSharkGameId}`);
  
  if (!response.ok) {
    throw new Error("Error al obtener detalles de CheapShark");
  }

  return response.json();
}
