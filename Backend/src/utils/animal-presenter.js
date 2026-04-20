function toAbsolutePhotoUrl(req, fotoUrl) {
  if (!fotoUrl) return null;
  if (/^https?:\/\//i.test(fotoUrl)) return fotoUrl;

  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  const normalizedPath = fotoUrl.startsWith('/') ? fotoUrl : `/${fotoUrl}`;

  return `${protocol}://${host}${normalizedPath}`;
}

function presentAnimal(req, animal) {
  if (!animal) return animal;
  return {
    ...animal,
    fotoUrl: toAbsolutePhotoUrl(req, animal.fotoUrl),
  };
}

function presentAnimalCollection(req, animals = []) {
  return animals.map((animal) => presentAnimal(req, animal));
}

function presentAnimalHistorial(req, payload) {
  if (!payload) return payload;
  return {
    ...payload,
    animal: presentAnimal(req, payload.animal),
  };
}

module.exports = {
  presentAnimal,
  presentAnimalCollection,
  presentAnimalHistorial,
};
