process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testBook;

beforeEach(async function () {
  const result = await db.query(`
    INSERT INTO books
      (isbn,
       amazon_url,
       author,
       language,
       pages,
       publisher,
       title,
       year)
    VALUES
      ('0691161518',
       'http://a.co/eobPtX2',
       'Matthew Lane',
       'english',
       264,
       'Princeton University Press',
       'Power-Up',
       2017)
    RETURNING isbn, amazon_url, author, language, pages,
              publisher, title, year`);

  testBook = result.rows[0];
});

afterEach(async function () {
  await db.query("DELETE FROM books");
});

afterAll(async function () {
  await db.end();
});


describe("GET /books", function () {
  test("Gets a list of books", async function () {
    const response = await request(app).get("/books");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      books: [testBook]
    });
  });
});


describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const response = await request(app)
      .get(`/books/${testBook.isbn}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      book: testBook
    });
  });

  test("Responds with 404 for invalid isbn", async function () {
    const response = await request(app)
      .get("/books/0");

    expect(response.statusCode).toBe(404);
  });
});


describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
      .post("/books")
      .send({
        isbn: "1234567890",
        amazon_url: "http://amazon.com",
        author: "Anton",
        language: "English",
        pages: 100,
        publisher: "Test Publisher",
        title: "Test Book",
        year: 2025
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toEqual({
      isbn: "1234567890",
      amazon_url: "http://amazon.com",
      author: "Anton",
      language: "English",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Book",
      year: 2025
    });
  });

  test("Prevents bad book data", async function () {
    const response = await request(app)
      .post("/books")
      .send({
        title: "Bad Book",
        pages: "hello"
      });

    expect(response.statusCode).toBe(400);
  });
});


describe("PUT /books/:isbn", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send({
        amazon_url: "http://amazon.com",
        author: "Updated Author",
        language: "English",
        pages: 500,
        publisher: "Updated Publisher",
        title: "Updated Title",
        year: 2026
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.book).toEqual({
      isbn: testBook.isbn,
      amazon_url: "http://amazon.com",
      author: "Updated Author",
      language: "English",
      pages: 500,
      publisher: "Updated Publisher",
      title: "Updated Title",
      year: 2026
    });
  });

  test("Prevents bad update data", async function () {
    const response = await request(app)
      .put(`/books/${testBook.isbn}`)
      .send({
        pages: "not-a-number"
      });

    expect(response.statusCode).toBe(400);
  });
});


describe("DELETE /books/:isbn", function () {
  test("Deletes a single book", async function () {
    const response = await request(app)
      .delete(`/books/${testBook.isbn}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "Book deleted"
    });
  });
});