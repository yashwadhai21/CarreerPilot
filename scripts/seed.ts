import mongoose from "mongoose"
import { internshipsData } from "../lib/internship-data"
import { coursesData } from "../lib/course-data"
import { InternshipModel } from "../lib/models/Internship"
import { CourseModel } from "../lib/models/Course"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb+srv://yashwadhai21_db_user:LEHFTHwuKjwe7yur@cluster0.zipu2md.mongodb.net/CareerPilot?retryWrites=true&w=majority"

async function seed() {
  console.log("Connecting to MongoDB Atlas...")
  let uri = MONGODB_URI.trim()
  if (uri.endsWith("?")) {
    uri += "retryWrites=true&w=majority"
  }

  await mongoose.connect(uri)
  console.log("Connected successfully.")

  console.log("Seeding internships...")
  await InternshipModel.deleteMany({})

  const internshipsToInsert = internshipsData.map((item) => ({
    ...item,
    externalId: `static:${item.id}`,
    source: "static",
  }))

  const insertedInternships = await InternshipModel.insertMany(internshipsToInsert)
  console.log(`Seeded ${insertedInternships.length} internships.`)

  console.log("Seeding courses...")
  await CourseModel.deleteMany({})

  const coursesToInsert = coursesData.map((item) => ({
    ...item,
    externalId: `course:${item.id}`,
  }))

  const insertedCourses = await CourseModel.insertMany(coursesToInsert)
  console.log(`Seeded ${insertedCourses.length} courses.`)

  await mongoose.disconnect()
  console.log("Database seeding completed successfully!")
}

seed().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
