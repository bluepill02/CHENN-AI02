export default async function handler(request, response) {
  // Free API from BigDataCloud, no key required for client-side usage usually, 
  // but proxying it helps avoid mixed content issues or future-proofs it.
  // Using the free endpoint: https://api.bigdatacloud.net/data/reverse-geocode-client
  
  const { lat, lng } = request.query;
  
  let url = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
  
  // If coordinates are provided, use them. Otherwise it defaults to IP location.
  if (lat && lng) {
    url += `?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  } else {
    url += `?localityLanguage=en`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error('Geolocation API error:', error);
    return response.status(500).json({ error: 'Failed to fetch location data' });
  }
}
