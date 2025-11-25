CREATE TABLE users(
    id SERIAL PRIMARY KEY ,
    age int,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL
);