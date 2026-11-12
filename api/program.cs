
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow our frontend to communicate with the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
        policy.WithOrigins(
            "http://localhost:5500",
            "http://127.0.0.1:5500")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Client");

// Our temporary database
var students = new List<Student>
{
    new(1, "John Peter", "Computer Science", "john@example.com"),
    new(2, "Mary James", "Software Engineering", "mary@example.com"),
    new(3, "David Mark", "Information Technology", "david@example.com")
};

int nextId = 4;

// GET: Display all students
app.MapGet("/api/students", () =>
{
    return Results.Ok(students);
});

// POST: Add a new student
app.MapPost("/api/students", (StudentInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Name) ||
        string.IsNullOrWhiteSpace(input.Department) ||
        string.IsNullOrWhiteSpace(input.Email))
    {
        return Results.BadRequest("All fields are required.");
    }

    var student = new Student(
        nextId++,
        input.Name.Trim(),
        input.Department.Trim(),
        input.Email.Trim()
    );

    students.Add(student);

    return Results.Created($"/api/students/{student.Id}", student);
});

// PUT: Edit a student
app.MapPut("/api/students/{id}", (int id, StudentInput input) =>
{
    var student = students.FirstOrDefault(s => s.Id == id);

    if (student == null)
        return Results.NotFound("Student not found.");

    if (string.IsNullOrWhiteSpace(input.Name) ||
        string.IsNullOrWhiteSpace(input.Department) ||
        string.IsNullOrWhiteSpace(input.Email))
    {
        return Results.BadRequest("All fields are required.");
    }

    student.Name = input.Name.Trim();
    student.Department = input.Department.Trim();
    student.Email = input.Email.Trim();

    return Results.Ok(student);
});

// DELETE: Remove a student
app.MapDelete("/api/students/{id}", (int id) =>
{
    var student = students.FirstOrDefault(s => s.Id == id);

    if (student == null)
        return Results.NotFound("Student not found.");

    students.Remove(student);

    return Results.NoContent();
});

app.Run();

// Student model
class Student
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Department { get; set; }
    public string Email { get; set; }

    public Student(int id, string name, string department, string email)
    {
        Id = id;
        Name = name;
        Department = department;
        Email = email;
    }
}

// Data received when adding or editing a student
record StudentInput(string Name, string Department, string Email);
