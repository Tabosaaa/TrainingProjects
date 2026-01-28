test("GET to /api/v1/status responds with 200 and correct body", async () => {
  const res = await fetch("http://localhost:3000/api/v1/status");
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: "ok" });
});