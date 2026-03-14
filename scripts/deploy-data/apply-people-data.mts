/**
 * Apply people data to the database.
 *
 * Creates/updates Person records for all known members (speakers + legacy users + email list).
 * Also upserts role definitions and custom field definitions.
 *
 * Uses upsert — safe to run multiple times.
 * Does NOT touch Members/Users (auth layer) or content tables.
 *
 * Usage: npx tsx scripts/deploy-data/apply-people-data.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id
console.log(`Church: ${church.name} (${churchId})\n`)

// ── People (speakers + legacy members) ───────────────────────
console.log('Upserting people...')
const PEOPLE: { slug: string; firstName: string; lastName: string; email?: string; title?: string; bio?: string; source?: string }[] = [
  // Speakers
  { slug: 'william-larsen', firstName: 'William', lastName: 'Larsen', email: 'williamjlarsen@gmail.com', title: 'Senior Pastor', bio: 'Pastor William Larsen has served as the senior shepherd of LA UBF since its founding. He leads the Sunday worship service and weekly Bible study.' },
  { slug: 'john-kwon', firstName: 'John', lastName: 'Kwon', email: 'johnkwon121@gmail.com', title: 'Associate Pastor' },
  { slug: 'david-park', firstName: 'David', lastName: 'Park', email: 'davidwanp@gmail.com', title: 'Associate Pastor' },
  { slug: 'robert-fishman', firstName: 'Robert', lastName: 'Fishman', email: 'rfishman2@gmail.com', title: 'Campus Minister' },
  { slug: 'ron-ward', firstName: 'Ron', lastName: 'Ward', title: 'Bible Teacher' },
  { slug: 'troy-segale', firstName: 'Troy', lastName: 'Segale', email: 'tsegale@gmail.com', title: 'Campus Minister' },
  { slug: 'frank-holman', firstName: 'Frank', lastName: 'Holman', email: 'franklin.holman@gmail.com', title: 'Bible Teacher' },
  { slug: 'david-min', firstName: 'David', lastName: 'Min', title: 'Bible Teacher' },
  { slug: 'paul-lim', firstName: 'Paul', lastName: 'Lim', email: 'lseu8@cs.com', title: 'Bible Teacher' },
  { slug: 'john-baik', firstName: 'John', lastName: 'Baik', title: 'Bible Teacher' },
  { slug: 'moses-yoon', firstName: 'Moses', lastName: 'Yoon', title: 'Bible Teacher' },
  { slug: 'timothy-cho', firstName: 'Timothy', lastName: 'Cho', title: 'Bible Teacher' },
  { slug: 'james-park', firstName: 'James', lastName: 'Park', email: 'jpark90241@yahoo.com', title: 'Bible Teacher' },
  { slug: 'andrew-cuevas', firstName: 'Andrew', lastName: 'Cuevas', email: 'awcuevas@gmail.com', title: 'Bible Teacher' },
  { slug: 'joshua-lopez', firstName: 'Joshua', lastName: 'Lopez', email: 'joshua.lopez.g@gmail.com', title: 'Bible Teacher' },
  { slug: 'juan-perez', firstName: 'Juan', lastName: 'Perez', email: 'jvperez13@gmail.com', title: 'Bible Teacher' },
  { slug: 'jason-koch', firstName: 'Jason', lastName: 'Koch', email: 'jkoch7@gmail.com', title: 'Bible Teacher' },
  { slug: 'isiah-pulido', firstName: 'Isiah', lastName: 'Pulido', email: 'waytruthlifeinchrist@gmail.com', title: 'Bible Teacher' },
  // Legacy members
  { slug: 'joseph-cho', firstName: 'Joseph', lastName: 'Cho', email: 'joseph.whcho@gmail.com', source: 'Legacy user account' },
  { slug: 'yerin', firstName: 'Yerin', lastName: '', email: 'cds05187@gmail.com', source: 'Legacy user account' },
  { slug: 'billy-park', firstName: 'Billy', lastName: 'Park', email: 'bcjmepark@gmail.com', source: 'Legacy user account' },
  { slug: 'young-choi', firstName: 'Young', lastName: 'Choi', email: 'mscfc472@gmail.com', source: 'Legacy user account' },
  { slug: 'rebecca-park', firstName: 'Rebecca', lastName: 'Park', email: 'parkrebecca@gmail.com', source: 'Legacy user account' },
  { slug: 'teresa-park', firstName: 'Teresa', lastName: 'Park', email: 'teresapark5145@gmail.com', source: 'Legacy user account' },
  { slug: 'youngran-chang', firstName: 'Youngran', lastName: 'Chang', email: 'djexpressusa@gmail.com', source: 'Legacy user account' },
  { slug: 'jennifer-perez', firstName: 'Jennifer', lastName: 'Perez', email: 'jvu008@gmail.com', source: 'Legacy user account' },
  { slug: 'grace-han', firstName: 'Grace', lastName: 'Han', email: 'gracehan1674@gmail.com', source: 'Legacy user account' },
  { slug: 'heather-koch', firstName: 'Heather', lastName: 'Koch', email: 'vision4more@gmail.com', source: 'Legacy user account' },
  { slug: 'rebecca-m', firstName: 'Rebecca', lastName: 'M', email: 'chun.rebecca@gmail.com', source: 'Legacy user account' },
  { slug: 'jae-yu', firstName: 'Jae', lastName: 'Yu', email: 'jamesyum3@gmail.com', source: 'Legacy user account' },
  { slug: 'leo', firstName: 'Leo', lastName: '', email: 'leo.alexanderg1999@gmail.com', source: 'Legacy user account' },
  { slug: 'lillia-michaud', firstName: 'Lillia', lastName: 'Michaud', email: 'lillia2@yahoo.com', source: 'Legacy user account' },
  { slug: 'maria-oh', firstName: 'Maria', lastName: 'Oh', email: 'almondblossom72@gmail.com', source: 'Legacy user account' },
  { slug: 'sangim-lee', firstName: 'Sangim', lastName: 'Lee', email: 'susanna2237@gmail.com', source: 'Legacy user account' },
  { slug: 'david-h-chung', firstName: 'David H', lastName: 'Chung', email: 'dchung3115@gmail.com', source: 'Legacy user account' },
  { slug: 'tatiana-liseth', firstName: 'Tatiana', lastName: 'Liseth', email: 'lisethtatiana3@gmail.com', source: 'Legacy user account' },
  { slug: 'keong-cha', firstName: 'Keong', lastName: 'Cha', email: 'pd154@hanmail.net', source: 'Legacy user account' },
  { slug: 'choibi', firstName: 'Choibi', lastName: '', email: 'globalchoibi@hanmail.net', source: 'Legacy user account' },
  { slug: 'danbee-park', firstName: 'Danbee', lastName: 'Park', email: 'p.sweetrain@gmail.com', source: 'Legacy user account' },
  { slug: 'jeongsoo-park', firstName: 'Jeongsoo', lastName: 'Park', email: 'mdjs0721@gmail.com', source: 'Legacy user account' },
  { slug: 'suvda', firstName: 'Suvda', lastName: '', email: 'suvdaaubf@gmail.com', source: 'Legacy user account' },
  { slug: 'veronika', firstName: 'Veronika', lastName: '', email: 'icc22122018@gmail.com', source: 'Legacy user account' },
  { slug: 'nataliya-cuevas', firstName: 'Nataliya', lastName: 'Cuevas', email: 'vitnava@gmail.com', source: 'Legacy user account' },
  { slug: 'jesse-lizarraga', firstName: 'Jesse', lastName: 'Lizarraga', email: 'lizarraga.jesse07@gmail.com', source: 'Legacy user account' },
  { slug: 'abigaelle-leigh', firstName: 'Abigaelle', lastName: 'Leigh', email: 'ab7.leigh@gmail.com', source: 'Legacy user account' },
  { slug: 'deborah-chang', firstName: 'Deborah', lastName: 'Chang', email: 'debbieyoungran26@gmail.com', source: 'Legacy user account' },
  { slug: 'peace-oh', firstName: 'Peace', lastName: 'Oh', email: 'peacehavefaith@gmail.com', source: 'Legacy user account' },
  { slug: 'lucia', firstName: 'Lucia', lastName: '', email: 'luciaochoa587@gmail.com', source: 'Legacy user account' },
  { slug: 'mark-lopez', firstName: 'Mark', lastName: 'Lopez', email: 'mark.yuji.lopez@gmail.com', source: 'Legacy user account' },
  { slug: 'julie-yu', firstName: 'Julie', lastName: 'Yu', email: 'juliehyunyu@gmail.com', source: 'Legacy user account' },
  { slug: 'daniel-shim', firstName: 'Daniel', lastName: 'Shim', email: 'dshim619@gmail.com', source: 'Legacy user account' },
  { slug: 'isa-lopez', firstName: 'Isa', lastName: 'Lopez', email: 'isabelcosslopez@gmail.com', source: 'Legacy user account' },
  { slug: 'juyoung-bang', firstName: 'Juyoung', lastName: 'Bang', email: 'jyb0658@gmail.com', source: 'Legacy user account' },
  { slug: 'grace-oh', firstName: 'Grace', lastName: 'Oh', email: 'graceoh11@gmail.com', source: 'Legacy user account' },
  { slug: 'rejoice-shim', firstName: 'Rejoice', lastName: 'Shim', email: 'jlmilj@gmail.com', source: 'Legacy user account' },
  { slug: 'terrence-lopez', firstName: 'Terrence', lastName: 'Lopez', email: 'tlopez5m@gmail.com', source: 'Legacy user account' },
  { slug: 'mari-lopez', firstName: 'Mari', lastName: 'Lopez', email: 'mari.lopez.y@gmail.com', source: 'Legacy user account' },
  { slug: 'blessing-cho', firstName: 'Blessing', lastName: 'Cho', email: 'ydchocpa@yahoo.com', source: 'Legacy user account' },
  { slug: 'alejandro-tapia', firstName: 'Alejandro', lastName: 'Tapia', email: 'alex.tapia.godinez@gmail.com', source: 'Legacy user account' },
  { slug: 'joanna-yoon', firstName: 'Joanna', lastName: 'Yoon', email: 'joannakyoon@gmail.com', source: 'Legacy user account' },
  { slug: 'david-cho', firstName: 'David', lastName: 'Cho', email: 'ydchocpa14@gmail.com', source: 'Legacy user account' },
  { slug: 'john-choi', firstName: 'John', lastName: 'Choi', email: 'chjohn9610@msn.com', source: 'Legacy user account' },
  { slug: 'anthony-mancini', firstName: 'Anthony', lastName: 'Mancini', email: 'anthonymancini.sped@gmail.com', source: 'Legacy user account' },
  { slug: 'jorge-lau', firstName: 'Jorge', lastName: 'Lau', email: 'jorgea.laujr@gmail.com', source: 'Legacy user account' },
  { slug: 'sarah-hyemi-segale', firstName: 'Sarah Hyemi', lastName: 'Segale', email: 'joygracepeacelove@gmail.com', source: 'Legacy user account' },
  { slug: 'denise-peralta', firstName: 'Denise', lastName: 'Peralta', email: 'peraltadenise97@gmail.com', source: 'Legacy user account' },
  { slug: 'mike-long', firstName: 'Mike', lastName: 'Long', email: 'bengi85@gmail.com', source: 'Legacy user account' },
  { slug: 'victoria-bae', firstName: 'Victoria', lastName: 'Bae', email: 'seunghoebr@gmail.com', source: 'Legacy user account' },
  { slug: 'anna-park', firstName: 'Anna', lastName: 'Park', email: 'annapark328@gmail.com', source: 'Legacy user account' },
  { slug: 'vicki-yu', firstName: 'Vicki', lastName: 'Yu', email: 'vctr37@gmail.com', source: 'Legacy user account' },
  { slug: 'miriam-fishman', firstName: 'Miriam', lastName: 'Fishman', email: 'fishmanmh@gmail.com', source: 'Legacy user account' },
  { slug: 'augustine-kim', firstName: 'Augustine', lastName: 'Kim', email: 'logoslifelove@gmail.com', source: 'Legacy user account' },
  { slug: 'pauline-jang', firstName: 'Pauline', lastName: 'Jang', email: 'jeongjang529@gmail.com', source: 'Legacy user account' },
  { slug: 'joseph-lopez', firstName: 'Joseph', lastName: 'Lopez', email: 'joseph.seiji.lopez@gmail.com', source: 'Legacy user account' },
  { slug: 'daniel-tuikhang', firstName: 'Daniel', lastName: 'Tuikhang', email: 'danieltkoren@gmail.com', source: 'Legacy user account' },
  { slug: 'banseok-kim', firstName: 'Banseok', lastName: 'Kim', email: 'kbspt88@googlemail.com', source: 'Legacy user account' },
  { slug: 'jinmi-chung', firstName: 'Jinmi', lastName: 'Chung', email: 'trulychung@gmail.com', source: 'Legacy user account' },
  { slug: 'maria-kwon', firstName: 'Maria', lastName: 'Kwon', email: 'mariakwon121@gmail.com', source: 'Legacy user account' },
  { slug: 'david-cho-2', firstName: 'David', lastName: 'Cho', email: 'laubf2020@gmail.com', source: 'Legacy user account' },
  { slug: 'petra-kim', firstName: 'Petra', lastName: 'Kim', email: 'kim.petra@gmail.com', source: 'Legacy user account' },
  { slug: 'dongsuk-jo', firstName: 'Dongsuk', lastName: 'Jo', email: 'greendong@me.com', source: 'Legacy user account' },
  { slug: 'alexis-estrada', firstName: 'Alexis', lastName: 'Estrada', email: 'alexis.estrada2319@yahoo.com', source: 'Legacy user account' },
  { slug: 'david-brad-lim', firstName: 'David Brad', lastName: 'Lim', email: 'david.lim@berkeley.edu', source: 'Legacy user account' },
  { slug: 'christie-brooks', firstName: 'Christie', lastName: 'Brooks', email: 'christiebrooks94@gmail.com', source: 'Legacy user account' },
  { slug: 'adabelle-rodriguez', firstName: 'Adabelle', lastName: 'Rodriguez', email: 'bellarodriguez9996@gmail.com', source: 'Legacy user account' },
  // Email-list-only contacts
  { slug: 'niklas-holman', firstName: 'Niklas', lastName: 'Holman', email: 'samiahalwani@msn.com', source: 'Legacy email list' },
  { slug: 'andrew-lopez', firstName: 'Andrew', lastName: 'Lopez', email: 'andrew.lopez.shuji@gmail.com', source: 'Legacy email list' },
  { slug: 'andrew-medina', firstName: 'Andrew', lastName: 'Medina', email: 'andrewom13579@gmail.com', source: 'Legacy email list' },
  { slug: 'andrew-park', firstName: 'Andrew', lastName: 'Park', email: 'ypark1@gmail.com', source: 'Legacy email list' },
  { slug: 'chamnan-tourn', firstName: 'Chamnan', lastName: 'Tourn', email: 'chamnan.im2012@gmail.com', source: 'Legacy email list' },
  { slug: 'daniel-park', firstName: 'Daniel', lastName: 'Park', email: 'parkdaniel2026@gmail.com', source: 'Legacy email list' },
  { slug: 'daniel-tourn', firstName: 'Daniel', lastName: 'Tourn', email: 'tourn3k@gmail.com', source: 'Legacy email list' },
  { slug: 'delilah-long', firstName: 'Delilah', lastName: 'Long', email: 'skyemom2004@hotmail.com', source: 'Legacy email list' },
  { slug: 'edward-yu', firstName: 'Edward', lastName: 'Yu', email: 'heemangyu@gmail.com', source: 'Legacy email list' },
  { slug: 'elijah-fishman', firstName: 'Elijah', lastName: 'Fishman', email: 'fishmanelijah@gmail.com', source: 'Legacy email list' },
  { slug: 'elizabeth-cho', firstName: 'Elizabeth', lastName: 'Cho', email: 'choelizabeth145@gmail.com', source: 'Legacy email list' },
  { slug: 'ellie-lim', firstName: 'Ellie', lastName: 'Lim', email: 'yookim93@gmail.com', source: 'Legacy email list' },
  { slug: 'evangeline-park', firstName: 'Evangeline', lastName: 'Park', email: 'evascarlet123@gmail.com', source: 'Legacy email list' },
  { slug: 'ezra-koch', firstName: 'Ezra', lastName: 'Koch', email: 'ezk999@gmail.com', source: 'Legacy email list' },
  { slug: 'ezra-shim', firstName: 'Ezra', lastName: 'Shim', email: 'ezra.shim@icloud.com', source: 'Legacy email list' },
  { slug: 'faith-park', firstName: 'Faith', lastName: 'Park', email: 'eunsook797@gmail.com', source: 'Legacy email list' },
  { slug: 'gideon-han', firstName: 'Gideon', lastName: 'Han', email: 'gideonhan7@gmail.com', source: 'Legacy email list' },
  { slug: 'hannah-park', firstName: 'Hannah', lastName: 'Park', email: 'parkhannah127@gmail.com', source: 'Legacy email list' },
  { slug: 'isaac-kim', firstName: 'Isaac', lastName: 'Kim', email: 'hdk121@gmail.com', source: 'Legacy email list' },
  { slug: 'isabel-park', firstName: 'Isabel', lastName: 'Park', email: 'isabelpark182@gmail.com', source: 'Legacy email list' },
  { slug: 'jeremy-park', firstName: 'Jeremy', lastName: 'Park', email: 'jpark3311@gmail.com', source: 'Legacy email list' },
  { slug: 'joanne-yu', firstName: 'Joanne', lastName: 'Yu', email: 'yujoanne321@gmail.com', source: 'Legacy email list' },
  { slug: 'joey-fishman', firstName: 'Joey', lastName: 'Fishman', email: 'fishformen123@gmail.com', source: 'Legacy email list' },
  { slug: 'john-park', firstName: 'John', lastName: 'Park', email: 'jparkjr7@gmail.com', source: 'Legacy email list' },
  { slug: 'joshua-han', firstName: 'Joshua', lastName: 'Han', email: 'jhan85056@gmail.com', source: 'Legacy email list' },
  { slug: 'livingston-jang', firstName: 'Livingston', lastName: 'Jang', email: 'livinjg079@gmail.com', source: 'Legacy email list' },
  { slug: 'madison-uy', firstName: 'Madison', lastName: 'Uy', email: 'madisonkayuy@gmail.com', source: 'Legacy email list' },
  { slug: 'maggie-wong', firstName: 'Maggie', lastName: 'Wong', email: 'wongmaggiemeikee@gmail.com', source: 'Legacy email list' },
  { slug: 'marilyn-kim', firstName: 'Marilyn', lastName: 'Kim', email: 'kim.marilyn417@gmail.com', source: 'Legacy email list' },
  { slug: 'moses-han', firstName: 'Moses', lastName: 'Han', email: 'moseshan1968@gmail.com', source: 'Legacy email list' },
  { slug: 'moses-lim', firstName: 'Moses', lastName: 'Lim', email: 'molim37@gmail.com', source: 'Legacy email list' },
  { slug: 'nathan-pozo', firstName: 'Nathan', lastName: 'Pozo', email: 'pozo.nathan@gmail.com', source: 'Legacy email list' },
  { slug: 'samuel-jang', firstName: 'Samuel', lastName: 'Jang', email: 'ssamj5913@gmail.com', source: 'Legacy email list' },
  { slug: 'sarah-park', firstName: 'Sarah', lastName: 'Park', email: 'sarahaku@gmail.com', source: 'Legacy email list' },
  { slug: 'taylor-park', firstName: 'Taylor', lastName: 'Park', email: 'ptwp5p@gmail.com', source: 'Legacy email list' },
]

const personIds: Record<string, string> = {}
for (const p of PEOPLE) {
  const person = await prisma.person.upsert({
    where: { churchId_slug: { churchId, slug: p.slug } },
    update: { title: p.title, bio: p.bio, email: p.email },
    create: {
      churchId,
      slug: p.slug,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      title: p.title,
      bio: p.bio,
      membershipStatus: 'MEMBER',
      source: p.source ?? 'Speaker from message data',
    },
  })
  personIds[p.slug] = person.id
}
console.log(`  ${PEOPLE.length} people`)

// ── Person Role Definitions ─────────────────────────────────
console.log('Upserting person role definitions...')
await prisma.personRoleDefinition.upsert({
  where: { churchId_slug: { churchId, slug: 'bible-study-leader' } },
  update: {},
  create: { churchId, name: 'Bible Study Leader', slug: 'bible-study-leader', description: 'Leaders who facilitate Bible study groups', isSystem: false, color: '#10b981', icon: 'book-open', sortOrder: 1 },
})
console.log('  1 role definition')

// ── Custom Field Definitions ───────────────────────────────
console.log('Upserting custom field definitions...')
const FIELDS = [
  { slug: 'emergency-contact', name: 'Emergency Contact', fieldType: 'TEXT', section: 'Emergency', isRequired: false, isVisible: true, sortOrder: 1 },
  { slug: 'emergency-phone', name: 'Emergency Phone', fieldType: 'TEXT', section: 'Emergency', isRequired: false, isVisible: true, sortOrder: 2 },
  { slug: 'allergies-medical-notes', name: 'Allergies / Medical Notes', fieldType: 'TEXT', section: 'Medical', isRequired: false, isVisible: false, sortOrder: 3 },
  { slug: 'tshirt-size', name: 'T-Shirt Size', fieldType: 'DROPDOWN', section: 'General', isRequired: false, isVisible: true, sortOrder: 4, options: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
  { slug: 'spiritual-gifts', name: 'Spiritual Gifts', fieldType: 'MULTI_SELECT', section: 'Spiritual', isRequired: false, isVisible: true, sortOrder: 5, options: ['Teaching', 'Leadership', 'Hospitality', 'Mercy', 'Evangelism', 'Worship', 'Administration', 'Encouragement', 'Giving', 'Service'] },
]
for (const f of FIELDS) {
  await prisma.customFieldDefinition.upsert({
    where: { churchId_slug: { churchId, slug: f.slug } },
    update: { name: f.name, section: f.section, isRequired: f.isRequired, isVisible: f.isVisible, sortOrder: f.sortOrder, options: f.options || [] },
    create: { churchId, name: f.name, slug: f.slug, fieldType: f.fieldType as any, section: f.section, isRequired: f.isRequired, isVisible: f.isVisible, sortOrder: f.sortOrder, options: f.options || [] },
  })
}
console.log(`  ${FIELDS.length} custom field definitions`)

console.log('\n✅ People data applied successfully!')

await prisma.$disconnect()
await pool.end()
