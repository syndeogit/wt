// apps/guest-site/app/utils/syndion.ts
//
// Slice O: client-side re-export of syndionCodeForSlug so the page template
// can gate on it without importing server code.

export { syndionCodeForSlug } from '~~/server/utils/syndion'
