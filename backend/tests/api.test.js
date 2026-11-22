process.env.JWT_SECRET = "test_secret";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const Admin = require("../src/models/admin.model");
const Department = require("../src/models/department.model");
const Doctor = require("../src/models/doctor.model");
const Token = require("../src/models/token.model");
const Sequence = require("../src/models/sequence.model");

jest.setTimeout(60000); // first run downloads a MongoDB binary

let mongo, dept, doctor, adminJwt, staffJwt;

const login = (username, password = "pass1234") =>
  request(app).post("/api/auth/login").send({ username, password });

const newToken = (patientName, priority = "normal") =>
  request(app).post("/api/tokens").send({ patientName, department: String(dept._id), priority });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); // temporary in-memory MongoDB
  await mongoose.connect(mongo.getUri());

  dept = await Department.create({ name: "General Medicine", code: "GM", avgConsultMinutes: 10 });
  doctor = await Doctor.create({ name: "Dr Test", department: dept._id, room: "Room 1" });
  await Admin.create({ username: "boss", password: "pass1234", role: "admin" });
  await Admin.create({ username: "desk", password: "pass1234", role: "staff" });

  adminJwt = (await login("boss")).body.token;
  staffJwt = (await login("desk")).body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Token.deleteMany({});
  await Sequence.deleteMany({});
});

describe("token numbers", () => {
  test("20 patients arriving at the same moment get 20 unique numbers", async () => {
    const responses = await Promise.all(Array.from({ length: 20 }, (_, i) => newToken(`Patient ${i}`)));

    expect(responses.every((r) => r.status === 201)).toBe(true);
    const numbers = responses.map((r) => r.body.tokenNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(responses[0].body.tokenCode).toMatch(/^GM-\d{3}$/);
  });
});

describe("priority queue", () => {
  test("emergency patient is called before an earlier normal patient", async () => {
    await newToken("Normal Patient");
    await newToken("Emergency Patient", "emergency");

    const res = await request(app)
      .patch("/api/tokens/call-next")
      .set("Authorization", `Bearer ${staffJwt}`)
      .send({ doctorId: String(doctor._id) });

    expect(res.status).toBe(200);
    expect(res.body.patientName).toBe("Emergency Patient");
    expect(res.body.status).toBe("serving");
    expect(res.body.calledAt).toBeDefined();
  });
});

describe("validation", () => {
  test("rejects a token request without a patient name", async () => {
    const res = await newToken("");
    expect(res.status).toBe(400);
  });

  test("rejects an invalid priority", async () => {
    const res = await newToken("Someone", "vip");
    expect(res.status).toBe(400);
  });
});

describe("authentication and roles", () => {
  test("queue list needs a login", async () => {
    const res = await request(app).get("/api/tokens");
    expect(res.status).toBe(401);
  });

  test("wrong password is rejected", async () => {
    const res = await login("boss", "wrongpass");
    expect(res.status).toBe(401);
  });

  test("staff cannot open analytics, admin can", async () => {
    const asStaff = await request(app).get("/api/analytics").set("Authorization", `Bearer ${staffJwt}`);
    expect(asStaff.status).toBe(403);

    await newToken("Someone");
    const asAdmin = await request(app).get("/api/analytics").set("Authorization", `Bearer ${adminJwt}`);
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.today.total).toBe(1);
  });
});
