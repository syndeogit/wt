// One-shot Directus setup for WindTribe on the shared Syndeo instance.
// Creates wt_centres, wt_products, wt_hotels collections, grants Public
// read access, seeds Karpathos. Idempotent — safe to re-run.
const https = require('https')
const { URL } = require('url')

const env = {}
require('fs')
  .readFileSync('.env.local', 'utf8')
  .split('\n')
  .forEach((l) => {
    const m = l.match(/^(\w+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  })

const DIRECTUS = env.NUXT_PUBLIC_DIRECTUS_URL
const HOST = new URL(DIRECTUS).host

function call(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const r = https.request(
      {
        host: HOST,
        path,
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let buf = ''
        res.on('data', (c) => (buf += c))
        res.on('end', () => resolve({ status: res.statusCode, body: buf }))
      },
    )
    r.on('error', reject)
    if (data) r.write(data)
    r.end()
  })
}

async function login() {
  const r = await call('/auth/login', 'POST', {
    email: env.DIRECTUS_ADMIN_EMAIL,
    password: env.DIRECTUS_ADMIN_PASSWORD,
  })
  if (r.status !== 200) throw new Error('Login failed: ' + r.body)
  return JSON.parse(r.body).data.access_token
}

// Collection shape helper.
function col(collection, note, fields) {
  return {
    collection,
    meta: {
      note,
      display_template: '{{name}}',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      sort_field: 'sort',
      accountability: 'all',
      singleton: false,
    },
    schema: {},
    fields,
  }
}

function uuidField() {
  return {
    field: 'id',
    type: 'uuid',
    meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
    schema: { is_primary_key: true, has_auto_increment: false },
  }
}

function statusField() {
  return {
    field: 'status',
    type: 'string',
    meta: {
      width: 'full',
      options: {
        choices: [
          { text: 'Published', value: 'published' },
          { text: 'Draft', value: 'draft' },
          { text: 'Archived', value: 'archived' },
        ],
      },
      interface: 'select-dropdown',
      display: 'labels',
      display_options: {
        showAsDot: true,
        choices: [
          { text: 'Published', value: 'published', foreground: '#FFFFFF', background: '#2ECDA7' },
          { text: 'Draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
          { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: '#A2B5CD' },
        ],
      },
    },
    schema: { default_value: 'draft', is_nullable: false },
  }
}

function sortField() {
  return {
    field: 'sort',
    type: 'integer',
    meta: { interface: 'input', hidden: true },
    schema: {},
  }
}

function timestamps() {
  return [
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
        width: 'half',
        display: 'datetime',
        display_options: { relative: true },
      },
      schema: {},
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
        width: 'half',
        display: 'datetime',
        display_options: { relative: true },
      },
      schema: {},
    },
  ]
}

function stringField(field, required, note) {
  return {
    field,
    type: 'string',
    meta: { interface: 'input', note, width: 'full' },
    schema: { is_nullable: !required },
  }
}

function textField(field, note) {
  return {
    field,
    type: 'text',
    meta: { interface: 'input-multiline', note, width: 'full' },
    schema: { is_nullable: true },
  }
}

function intField(field, note) {
  return {
    field,
    type: 'integer',
    meta: { interface: 'input', note, width: 'half' },
    schema: { is_nullable: true },
  }
}

function jsonField(field, note) {
  return {
    field,
    type: 'json',
    meta: { interface: 'tags', note, width: 'full', special: ['cast-json'] },
    schema: { is_nullable: true },
  }
}

function dropdownField(field, choices, note) {
  return {
    field,
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: { choices: choices.map((v) => ({ text: v, value: v })) },
      note,
      width: 'half',
    },
    schema: { is_nullable: true },
  }
}

const centresCol = col(
  'wt_centres',
  'WindTribe destinations — content for centre/destination pages.',
  [
    uuidField(),
    statusField(),
    sortField(),
    ...timestamps(),
    {
      ...stringField('slug', true, 'URL slug — lowercase, no spaces.'),
      schema: { is_unique: true, is_nullable: false },
    },
    stringField('name', true, 'Centre display name.'),
    stringField('tagline', false, 'Short one-liner under the centre name.'),
    textField('description', 'Long-form description rendered on the destination page.'),
    stringField('country', false, 'Country name.'),
    stringField('region', false, 'Region or island.'),
    stringField('hero_image', false, 'URL of the hero image. Swap to file relationship later.'),
    jsonField('gallery', 'Array of image URLs for the gallery.'),
    {
      field: 'latitude',
      type: 'float',
      meta: {
        interface: 'input',
        note: 'Decimal degrees, e.g. 35.61 for Karpathos. Used by /api/conditions to fetch weather.',
        width: 'half',
      },
      schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 6 },
    },
    {
      field: 'longitude',
      type: 'float',
      meta: {
        interface: 'input',
        note: 'Decimal degrees, e.g. 27.10 for Karpathos.',
        width: 'half',
      },
      schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 6 },
    },
    {
      field: 'timezone',
      type: 'string',
      meta: {
        interface: 'input',
        note: 'IANA timezone, e.g. Europe/Athens. Used to localise forecast hours.',
        width: 'full',
      },
      schema: { is_nullable: true },
    },
  ],
)

const productsCol = col('wt_products', 'Lessons, rentals, and packages bookable at a centre.', [
  uuidField(),
  statusField(),
  sortField(),
  ...timestamps(),
  {
    field: 'centre',
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      options: { template: '{{name}}' },
      note: 'Centre this product belongs to.',
      width: 'full',
      special: ['m2o'],
    },
    schema: { is_nullable: false },
  },
  dropdownField('kind', ['lesson', 'rental', 'package'], 'Type of product.'),
  dropdownField('discipline', ['wingfoil', 'windsurf', 'kitesurf'], 'Which wind sport.'),
  stringField('name', true, 'Product display name.'),
  stringField('summary', false, 'One-line summary for cards.'),
  textField('description', 'Long-form description rendered on product detail.'),
  intField('price_cents', 'Total price in cents (e.g. 28500 = €285.00).'),
  {
    ...stringField('currency', false, 'ISO 4217 currency code.'),
    schema: { default_value: 'EUR', is_nullable: false },
  },
  stringField(
    'duration_label',
    false,
    'Human-readable duration (e.g. "5 mornings · coaching + kit").',
  ),
  dropdownField(
    'min_level',
    ['beginner', 'intermediate', 'advanced'],
    'Minimum skill level required.',
  ),
  stringField('image', false, 'URL of the product image. Swap to file relationship later.'),
  jsonField('includes', 'Array of short "what\'s included" strings.'),
])

const hotelsCol = col('wt_hotels', 'Partner accommodation optionally bundled with bookings.', [
  uuidField(),
  statusField(),
  sortField(),
  ...timestamps(),
  {
    field: 'centre',
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      options: { template: '{{name}}' },
      note: 'Centre this hotel is partnered with.',
      width: 'full',
      special: ['m2o'],
    },
    schema: { is_nullable: false },
  },
  stringField('name', true, 'Hotel display name.'),
  stringField('summary', false, 'One-line summary for cards.'),
  stringField('image', false, 'URL of the hotel hero image.'),
  intField('nightly_from_cents', 'Starting nightly rate in cents.'),
  {
    ...stringField('currency', false, 'ISO 4217.'),
    schema: { default_value: 'EUR', is_nullable: false },
  },
])

async function collectionExists(name, token) {
  const r = await call(`/collections/${name}`, 'GET', null, token)
  return r.status === 200
}

async function createCollection(def, token) {
  const exists = await collectionExists(def.collection, token)
  if (exists) {
    console.log(`  ${def.collection} already exists — skipping`)
    return
  }
  const r = await call('/collections', 'POST', def, token)
  if (r.status >= 200 && r.status < 300) {
    console.log(`  created ${def.collection}`)
  } else {
    console.log(`  FAILED creating ${def.collection}: ${r.status}`, r.body.slice(0, 500))
    throw new Error('halt')
  }
}

// Create m2o relation from products.centre -> centres
async function createRelation(collection, field, related, token) {
  const r = await call(
    '/relations',
    'POST',
    {
      collection,
      field,
      related_collection: related,
      meta: { sort_field: null, one_field: null },
      schema: { on_delete: 'SET NULL' },
    },
    token,
  )
  if (r.status >= 200 && r.status < 300) {
    console.log(`  relation ${collection}.${field} -> ${related}`)
  } else if (/already exists|duplicate/i.test(r.body)) {
    console.log(`  relation ${collection}.${field} -> ${related} already exists`)
  } else {
    console.log(`  FAILED relation ${collection}.${field}: ${r.status}`, r.body.slice(0, 400))
  }
}

// Grant Public role read access on all wt_* collections.
async function grantPublicRead(token) {
  // Directus 11 on the Syndeo instance ships with a "Content - Public"
  // policy representing unauthenticated visitors. Look it up by name
  // (covers future rename) rather than hardcoding the UUID.
  const r = await call(
    `/policies?filter[name][_eq]=${encodeURIComponent('Content - Public')}`,
    'GET',
    null,
    token,
  )
  let policyId = null
  if (r.status === 200) {
    const policies = JSON.parse(r.body).data
    if (policies && policies[0]) policyId = policies[0].id
  }
  if (!policyId) {
    console.log(
      '  "Content - Public" policy not found — skipping. Create/rename it in /admin/policies and re-run.',
    )
    return
  }
  const collections = ['wt_centres', 'wt_products', 'wt_hotels']
  for (const coll of collections) {
    // check if permission exists
    const check = await call(
      `/permissions?filter[${policyId ? 'policy' : 'role'}][_eq]=${policyId || 'null'}&filter[collection][_eq]=${coll}&filter[action][_eq]=read`,
      'GET',
      null,
      token,
    )
    const existing = check.status === 200 ? JSON.parse(check.body).data : []
    if (existing && existing.length) {
      console.log(`  public read on ${coll} already granted`)
      continue
    }
    const permBody = {
      policy: policyId,
      collection: coll,
      action: 'read',
      permissions: { status: { _eq: 'published' } },
      validation: null,
      presets: null,
      fields: ['*'],
    }
    const g = await call('/permissions', 'POST', permBody, token)
    if (g.status >= 200 && g.status < 300) {
      console.log(`  granted public read on ${coll}`)
    } else {
      console.log(`  FAILED granting public read on ${coll}: ${g.status}`, g.body.slice(0, 400))
    }
  }
}

async function seed(token) {
  // Create Karpathos centre
  const centreBody = {
    status: 'published',
    slug: 'karpathos',
    name: 'ION Karpathos',
    tagline: 'Thermal wind, blue water, honest food.',
    description:
      'Karpathos is the Aegean windsurfing reference. ION Karpathos sits on the south bay with a long steady beam reach, beginner-friendly flats, and swell further out for the advanced. Wing, windsurf, kite — all three, with coaches who grew up on this bay.',
    country: 'Greece',
    region: 'Dodecanese',
    hero_image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    ],
  }

  // Idempotent: check if a centre with this slug already exists.
  const check = await call(
    '/items/wt_centres?filter[slug][_eq]=karpathos&fields=id,slug,name',
    'GET',
    null,
    token,
  )
  let centreId = null
  if (check.status === 200) {
    const existing = JSON.parse(check.body).data
    if (existing && existing.length) {
      centreId = existing[0].id
      console.log(`  Karpathos already seeded (id ${centreId}) — skipping centre insert`)
    }
  }
  if (!centreId) {
    const r = await call('/items/wt_centres', 'POST', centreBody, token)
    if (r.status >= 200 && r.status < 300) {
      centreId = JSON.parse(r.body).data.id
      console.log(`  seeded Karpathos centre (id ${centreId})`)
    } else {
      console.log('  FAILED seeding Karpathos:', r.status, r.body.slice(0, 500))
      throw new Error('halt')
    }
  }

  // Products
  const products = [
    {
      status: 'published',
      centre: centreId,
      kind: 'package',
      discipline: 'wingfoil',
      name: 'Wing for beginners — 5 days',
      summary:
        'Five days from "never tried it" to first independent flights. Equipment, coaching and water time included.',
      description:
        'The whole point of WindTribe. Five mornings on the gentle inside lagoon learning to handle the wing on land, then on the board, then up on the foil. Coach in the water with you. Group cap of three. By Friday afternoon, most riders have their first sustained flights.',
      price_cents: 89000,
      currency: 'EUR',
      duration_label: '5 mornings · coaching + kit',
      min_level: 'beginner',
      image:
        'https://images.unsplash.com/photo-1530870110042-98b2cb110834?auto=format&fit=crop&w=1200&q=80',
      includes: [
        'Wing + foil board + leash',
        'Wetsuit + impact vest',
        'Coach in the water (max 3 riders)',
        'Daily video debrief',
        'Recovery dinner on day 5',
      ],
    },
    {
      status: 'published',
      centre: centreId,
      kind: 'lesson',
      discipline: 'windsurf',
      name: 'Windsurf for beginners — 3 days',
      summary: 'Three afternoons on the flats, small groups, all gear included.',
      description:
        'For complete first-timers or returning beginners. You will rig, balance, turn, and ride upwind by day three. Group cap of four riders per instructor.',
      price_cents: 28500,
      currency: 'EUR',
      duration_label: '3 afternoons · 3 hrs each',
      min_level: 'beginner',
      image:
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
      includes: [
        'Board + rig',
        'Wetsuit + harness',
        'Group instruction (max 4)',
        'Progress video on day 3',
      ],
    },
    {
      status: 'published',
      centre: centreId,
      kind: 'lesson',
      discipline: 'windsurf',
      name: 'Windsurf improver clinic — 2 days',
      summary: 'Move from tacks to gybes, planing, harness lines.',
      description:
        'For riders who can already sail upwind and are looking for the next step. Coach sails with you, debrief with video after each session.',
      price_cents: 24000,
      currency: 'EUR',
      duration_label: '2 afternoons · 3 hrs each',
      min_level: 'intermediate',
      image:
        'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1200&q=80',
      includes: ['Advanced rig options', 'Video coaching', '1:2 coach to rider ratio'],
    },
    {
      status: 'published',
      centre: centreId,
      kind: 'rental',
      discipline: 'windsurf',
      name: 'Daily rental — windsurf kit',
      summary: 'All-day access to board + sail. Free size changes at the centre through the day.',
      description:
        'Full range of modern kit. Swap boards or sails at any time. Daily check-in with the beach manager on conditions.',
      price_cents: 6500,
      currency: 'EUR',
      duration_label: 'Full day',
      min_level: 'intermediate',
      image:
        'https://images.unsplash.com/photo-1520975918318-79c51c7e1664?auto=format&fit=crop&w=1200&q=80',
      includes: ['Board of choice', 'Rig of choice', 'Unlimited swaps', 'Beach briefing'],
    },
    {
      status: 'published',
      centre: centreId,
      kind: 'package',
      discipline: 'windsurf',
      name: 'Wind week — 5 days',
      summary: 'Five days on the water at your level. Coaching plus free rental between sessions.',
      description:
        'The classic windsurf week. Coaching tailored to your level every afternoon, open rental access mornings and evenings. Best value if you are coming for more than a long weekend.',
      price_cents: 58000,
      currency: 'EUR',
      duration_label: '5 days · coaching + rental',
      min_level: 'beginner',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      includes: [
        '5 afternoons of coaching',
        'Unlimited rental outside coaching',
        'Group size capped',
        'Welcome + farewell dinner',
      ],
    },
  ]

  for (const p of products) {
    const check = await call(
      `/items/wt_products?filter[centre][_eq]=${centreId}&filter[name][_eq]=${encodeURIComponent(p.name)}&fields=id`,
      'GET',
      null,
      token,
    )
    if (check.status === 200 && JSON.parse(check.body).data.length) {
      console.log(`  product "${p.name}" already seeded — skipping`)
      continue
    }
    const r = await call('/items/wt_products', 'POST', p, token)
    if (r.status >= 200 && r.status < 300) {
      console.log(`  seeded product "${p.name}"`)
    } else {
      console.log(`  FAILED seeding "${p.name}":`, r.status, r.body.slice(0, 400))
    }
  }

  // Hotels
  const hotels = [
    {
      status: 'published',
      centre: centreId,
      name: 'Poseidon Bay Rooms',
      summary: 'Walk-to-beach studios on the south bay. Kitchenette, AC, sea-view balconies.',
      image:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      nightly_from_cents: 8500,
      currency: 'EUR',
    },
    {
      status: 'published',
      centre: centreId,
      name: 'Anemos House',
      summary: 'Small family-run pension 5 min walk from the centre. Breakfast on the terrace.',
      image:
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb210ce?auto=format&fit=crop&w=1200&q=80',
      nightly_from_cents: 12000,
      currency: 'EUR',
    },
  ]

  for (const h of hotels) {
    const check = await call(
      `/items/wt_hotels?filter[centre][_eq]=${centreId}&filter[name][_eq]=${encodeURIComponent(h.name)}&fields=id`,
      'GET',
      null,
      token,
    )
    if (check.status === 200 && JSON.parse(check.body).data.length) {
      console.log(`  hotel "${h.name}" already seeded — skipping`)
      continue
    }
    const r = await call('/items/wt_hotels', 'POST', h, token)
    if (r.status >= 200 && r.status < 300) {
      console.log(`  seeded hotel "${h.name}"`)
    } else {
      console.log(`  FAILED seeding "${h.name}":`, r.status, r.body.slice(0, 400))
    }
  }
}

;(async () => {
  console.log('[1/5] login')
  const token = await login()

  console.log('[2/5] collections')
  await createCollection(centresCol, token)
  await createCollection(productsCol, token)
  await createCollection(hotelsCol, token)

  console.log('[3/5] relations')
  await createRelation('wt_products', 'centre', 'wt_centres', token)
  await createRelation('wt_hotels', 'centre', 'wt_centres', token)

  console.log('[4/5] public read permissions (published only)')
  await grantPublicRead(token)

  console.log('[5/5] seed Karpathos')
  await seed(token)

  console.log('Done.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
