test("GET to /api/v1/status responds with 200 and correct body", async () => {
  const res = await fetch("http://localhost:3000/api/v1/status");
  expect(res.status).toBe(200);

  const responseBody = await res.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.dependecies.database.version).toEqual(expect.any(String));
  expect(responseBody.dependecies.database.version).toMatch(/^\d+(\.\d+)?/);

  expect(responseBody.dependecies.database.max_connections).toEqual(
    expect.any(Number),
  );
  expect(Number.isInteger(responseBody.dependecies.database.max_connections)).toBe(
    true,
  );
  expect(responseBody.dependecies.database.max_connections).toBeGreaterThan(0);

  expect(responseBody.dependecies.database.opened_connections).toEqual(
    expect.any(Number),
  );
  expect(
    Number.isInteger(responseBody.dependecies.database.opened_connections),
  ).toBe(true);
  expect(responseBody.dependecies.database.opened_connections).toBeGreaterThan(0);
  expect(responseBody.dependecies.database.opened_connections).toBeLessThanOrEqual(
    responseBody.dependecies.database.max_connections,
  );
});
