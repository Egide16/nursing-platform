import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo password for every seeded user — change immediately in any real
// deployment. Printed again at the end of the seed run as a reminder.
const DEMO_PASSWORD = "ChangeMe123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Courses -----------------------------------------------------
  const courseData = [
    {
      slug: "crma",
      title: "Certified Resident Medication Aide (CRMA)",
      summary:
        "Medication administration fundamentals for staff working in group home / residential settings.",
      order: 1,
      validityMonths: 24,
      modules: [
        {
          title: "Scope of Practice for Medication Aides",
          body: "A CRMA administers medication under a delegating nurse's supervision and within the specific scope defined by state regulation. Tasks outside that scope — such as adjusting a dose or administering a new medication without an order — are escalated, never improvised.",
        },
        {
          title: "The Medication Administration Record (MAR)",
          body: "Every dose given is charted on the MAR at the time it is given, not before and not from memory later. A missed or refused dose is documented with the reason, and any pattern of refusal is reported to the supervising nurse.",
        },
        {
          title: "Recognizing Adverse Reactions",
          body: "A CRMA is trained to recognize early signs of an adverse reaction — rash, difficulty breathing, sudden confusion — and to know the difference between a reportable event and a routine side effect already noted in the resident's care plan.",
        },
      ],
      questions: [
        {
          prompt: "A CRMA may administer a new medication without a delegating nurse's order when the resident requests it.",
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true },
          ],
        },
        {
          prompt: "When should a dose be documented on the MAR?",
          options: [
            { text: "At the end of the shift, from memory", isCorrect: false },
            { text: "At the time it is administered", isCorrect: true },
            { text: "The next morning", isCorrect: false },
          ],
        },
        {
          prompt: "A resident develops sudden difficulty breathing after a dose. This is:",
          options: [
            { text: "A routine side effect to note at the next visit", isCorrect: false },
            { text: "A reportable adverse reaction requiring immediate escalation", isCorrect: true },
          ],
        },
      ],
    },
    {
      slug: "insulin-administration",
      title: "Insulin Administration",
      summary: "Safe insulin storage, dosing checks, and hypoglycemia response.",
      order: 2,
      validityMonths: 12,
      modules: [
        {
          title: "Insulin Types & Storage",
          body: "Unopened insulin is refrigerated; an in-use pen or vial is generally kept at room temperature and discarded after its labeled in-use period, even if it isn't empty. Mixing up rapid-acting and long-acting insulin is one of the most common and most dangerous medication errors in this category.",
        },
        {
          title: "The Independent Double-Check",
          body: "Insulin is a high-alert medication: the dose drawn up is verified by a second qualified staff member before it's given, every time, regardless of how routine the dose feels.",
        },
        {
          title: "Recognizing & Responding to Hypoglycemia",
          body: "Shakiness, sweating, confusion, and irritability can all signal low blood sugar. The response is fast-acting glucose first, followed by a recheck — not waiting to see if symptoms pass on their own.",
        },
      ],
      questions: [
        {
          prompt: "An in-use insulin pen should generally be stored:",
          options: [
            { text: "In the freezer", isCorrect: false },
            { text: "At room temperature, discarded after its in-use period", isCorrect: true },
            { text: "It never needs to be discarded if insulin remains", isCorrect: false },
          ],
        },
        {
          prompt: "Before administering insulin, the dose should be:",
          options: [
            { text: "Given immediately to save time", isCorrect: false },
            { text: "Independently double-checked by a second qualified staff member", isCorrect: true },
          ],
        },
        {
          prompt: "A resident is shaky, sweating, and confused. The first response is:",
          options: [
            { text: "Wait 30 minutes to see if it resolves", isCorrect: false },
            { text: "Give fast-acting glucose and recheck", isCorrect: true },
          ],
        },
      ],
    },
    {
      slug: "first-aid",
      title: "First Aid & Emergency Response",
      summary: "Core first aid skills for common emergencies in a residential care setting.",
      order: 3,
      validityMonths: 24,
      modules: [
        {
          title: "Primary Assessment",
          body: "Before treating any specific injury, a quick check of responsiveness, breathing, and severe bleeding determines what happens next — and whether emergency services are called immediately.",
        },
        {
          title: "Choking & Falls",
          body: "For a conscious, choking adult, abdominal thrusts are the standard response. After a fall, a resident is not moved if a head, neck, or spinal injury is suspected, unless there is an immediate danger to remaining in place.",
        },
        {
          title: "When to Call Emergency Services",
          body: "Any loss of consciousness, chest pain, uncontrolled bleeding, or suspected stroke warrants an immediate call to emergency services — the threshold is deliberately low in a residential care setting.",
        },
      ],
      questions: [
        {
          prompt: "The first step before treating a specific injury is:",
          options: [
            { text: "A quick primary assessment of responsiveness, breathing, and bleeding", isCorrect: true },
            { text: "Moving the resident to a more comfortable position", isCorrect: false },
          ],
        },
        {
          prompt: "After a fall with suspected head or spinal injury, the resident should:",
          options: [
            { text: "Be helped up right away", isCorrect: false },
            { text: "Generally not be moved unless there's immediate danger", isCorrect: true },
          ],
        },
        {
          prompt: "Which of these warrants an immediate emergency call?",
          options: [
            { text: "Suspected stroke symptoms", isCorrect: true },
            { text: "A minor bruise", isCorrect: false },
          ],
        },
      ],
    },
  ];

  for (const c of courseData) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        order: c.order,
        validityMonths: c.validityMonths,
        modules: { create: c.modules.map((m, i) => ({ ...m, order: i })) },
        questions: {
          create: c.questions.map((q, i) => ({
            prompt: q.prompt,
            order: i,
            options: { create: q.options.map((o, j) => ({ ...o, order: j })) },
          })),
        },
      },
    });
  }

  const courses = await prisma.course.findMany({ orderBy: { order: "asc" } });

  // ---- Checklist template -------------------------------------------
  const template = await prisma.checklistTemplate.create({
    data: {
      name: "Standard Group Home Inspection",
      items: {
        create: [
          { category: "Medication Management", label: "MAR is current and matches physician orders", order: 0 },
          { category: "Medication Management", label: "Medications stored securely and per label instructions", order: 1 },
          { category: "Medication Management", label: "No expired medications on site", order: 2 },
          { category: "Staffing", label: "Staff on duty hold current, unexpired required certifications", order: 3 },
          { category: "Staffing", label: "Staff-to-resident ratio meets requirement", order: 4 },
          { category: "Safety", label: "Fire extinguishers present and inspected within the last year", order: 5 },
          { category: "Safety", label: "Emergency exits unobstructed", order: 6 },
          { category: "Safety", label: "First aid kit stocked and accessible", order: 7 },
          { category: "Resident Care", label: "Individual care plans on file and current", order: 8 },
          { category: "Resident Care", label: "Incident reports from the last 90 days reviewed", order: 9 },
        ],
      },
    },
  });

  // ---- Companies, group homes, clients -------------------------------
  const companyA = await prisma.company.create({ data: { name: "Cedar Grove Residential Services" } });
  const companyB = await prisma.company.create({ data: { name: "Harborview Group Homes" } });

  const homeA1 = await prisma.groupHome.create({
    data: { companyId: companyA.id, name: "Cedar Grove House 1", address: "12 Birch St, Lewiston, ME" },
  });
  const homeB1 = await prisma.groupHome.create({
    data: { companyId: companyB.id, name: "Harborview East", address: "88 Dockside Ave, Portland, ME" },
  });

  await prisma.client.createMany({
    data: [
      { groupHomeId: homeA1.id, name: "Resident A1" },
      { groupHomeId: homeA1.id, name: "Resident A2" },
      { groupHomeId: homeB1.id, name: "Resident B1" },
    ],
  });

  // ---- Users ----------------------------------------------------------
  const superAdmin = await prisma.user.create({
    data: { name: "Meridian Admin", email: "admin@meridian-nc.example", passwordHash, role: Role.SUPER_ADMIN },
  });
  const inspector = await prisma.user.create({
    data: { name: "Jordan Inspector", email: "inspector@meridian-nc.example", passwordHash, role: Role.INSPECTOR },
  });
  const companyAdminA = await prisma.user.create({
    data: {
      name: "Casey (Cedar Grove Admin)",
      email: "admin@cedargrove.example",
      passwordHash,
      role: Role.COMPANY_ADMIN,
      companyId: companyA.id,
    },
  });
  const studentA1 = await prisma.user.create({
    data: {
      name: "Alex Student",
      email: "alex@cedargrove.example",
      passwordHash,
      role: Role.STUDENT,
      companyId: companyA.id,
    },
  });

  // First course unlocked, rest locked — same pattern the student app enforces at runtime.
  for (const [i, course] of courses.entries()) {
    await prisma.courseProgress.create({
      data: {
        userId: studentA1.id,
        courseId: course.id,
        status: i === 0 ? "UNLOCKED" : "LOCKED",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Checklist template:", template.name);
  console.log("Demo login password for all seeded users:", DEMO_PASSWORD);
  console.log("  super admin:   admin@meridian-nc.example");
  console.log("  inspector:     inspector@meridian-nc.example");
  console.log("  company admin: admin@cedargrove.example  (Cedar Grove Residential Services)");
  console.log("  student:       alex@cedargrove.example");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
