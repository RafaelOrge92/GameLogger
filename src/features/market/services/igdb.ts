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
    // Traemos datos básicos de juegos retro principales (generación <= 7 o lanzados antes de 2013, excluyendo hacks/mods)
    body: `search "${query}"; where (platforms.generation <= 7 | first_release_date < 1356998400) & parent_game = null; fields name, cover.url, platforms.name, first_release_date; limit 10;`,
    // Añadimos revalidate para cachear las búsquedas por 1 hora y no gastar cuota de API
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    console.error("IGDB Error:", await response.text());
    throw new Error("Error al consultar IGDB");
  }

  const data = await response.json();
  
  // IGDB devuelve las imágenes en tamaño 'thumb' (miniatura) por defecto.
  // Reemplazamos 't_thumb' por 't_cover_big' para tener mejor resolución en el frontend.
  return data.map((game: any) => ({
    id: game.id,
    name: game.name,
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
    platforms: game.platforms?.map((p: any) => p.name) || [],
    coverUrl: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null
  }));
}
