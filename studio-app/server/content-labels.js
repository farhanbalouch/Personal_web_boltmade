// Shared by both owner APIs and the publishing worker. No user HTML or paths.
export function validateLabels(body) {
  const result = {};
  for (const [name, max] of [['shortTitle', 80], ['secondaryTitle', 180]]) {
    if (body[name] !== undefined) {
      if (typeof body[name] !== 'string' || body[name].length > max || /[\r\n]/.test(body[name]))
        throw Object.assign(new Error(`${name} must be one line, up to ${max} characters.`), { status: 400 });
      result[name] = body[name].trim();
    }
  }
  if (body.urlSlug !== undefined) {
    if (typeof body.urlSlug !== 'string' || (body.urlSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.urlSlug)) || body.urlSlug.length > 64)
      throw Object.assign(new Error('Use a short link with lowercase English letters, numbers and hyphens (64 characters maximum).'), { status: 400 });
    if (body.kind === 'chapter' && body.urlSlug && body.urlSlug !== body.slug)
      throw Object.assign(new Error('Biography chapter addresses stay fixed. You can edit their names.'), { status: 400 });
    result.urlSlug = body.urlSlug;
  }
  if (body.metadataOnly === true) {
    if (!body.slug) throw Object.assign(new Error('Choose published content for a names-only update.'), { status: 400 });
    result.metadataOnly = true;
  }
  return result;
}
export function applyLabels(translations, request) {
  const copy = structuredClone(translations);
  for (const field of ['shortTitle', 'secondaryTitle']) if (request[field] !== undefined && (request[field] || request.metadataOnly)) copy.en[field] = request[field];
  return copy;
}
