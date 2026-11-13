var builder = WebApplication.CreateBuilder(args);

// Swagger lets you test the API directly in your browser.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow the Student Management frontend on port 5500 to use this API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
        policy.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Client");

// Six starting students: three in each department.
// IDs are unique across the WHOLE system, not repeated for each department.
var students = new List<Student>
{
    new(1, "John Peter", "Software Engineering", "john@example.com"),
    new(2, "Mary James", "Software Engineering", "mary@example.com"),
    new(3, "Ada Okafor", "Software Engineering", "ada@example.com"),
    new(4, "David Mark", "Information Technology", "david@example.com"),
    new(5, "Amina Yusuf", "Information Technology", "amina@example.com"),
    new(6, "Chidera Nwosu", "Information Technology", "chidera@example.com")
};

int nextId = 7;

// READ: Get every student, or optionally filter: /api/students?department=Software%20Engineering
app.MapGet("/api/students", (string? department) =>
{
    if (string.IsNullOrWhiteSpace(department))
        return Results.Ok(students);

    string? validDepartment = NormaliseDepartment(department);
    if (validDepartment == null)
        return Results.BadRequest("Department must be Software Engineering or Information Technology.");

    return Results.Ok(students.Where(s => s.Department == validDepartment).ToList());
});

// READ: Find a single student using a unique ID.
app.MapGet("/api/students/{id:int}", (int id) =>
{
    var student = students.FirstOrDefault(s => s.Id == id);
    return student == null ? Results.NotFound("Student not found.") : Results.Ok(student);
});

// READ: Show the available departments.
app.MapGet("/api/departments", () =>
    Results.Ok(new[] { "Software Engineering", "Information Technology" }));

// READ: Show students from one department.
app.MapGet("/api/departments/{department}/students", (string department) =>
{
    string? validDepartment = NormaliseDepartment(department);
    if (validDepartment == null)
        return Results.BadRequest("Department must be Software Engineering or Information Technology.");

    return Results.Ok(students.Where(s => s.Department == validDepartment).ToList());
});

// CREATE: Add a student to the selected department.
app.MapPost("/api/students", (StudentInput input) =>
{
    string? validDepartment = NormaliseDepartment(input.Department);
    if (!ValidStudent(input) || validDepartment == null)
        return Results.BadRequest("Enter a name, email and valid department.");

    var student = new Student(nextId++, input.Name.Trim(), validDepartment, input.Email.Trim());
    students.Add(student);

    return Results.Created($"/api/students/{student.Id}", student);
});

// UPDATE: Edit the name, email or department of a student.
app.MapPut("/api/students/{id:int}", (int id, StudentInput input) =>
{
    var student = students.FirstOrDefault(s => s.Id == id);
    if (student == null)
        return Results.NotFound("Student not found.");

    string? validDepartment = NormaliseDepartment(input.Department);
    if (!ValidStudent(input) || validDepartment == null)
        return Results.BadRequest("Enter a name, email and valid department.");

    student.Name = input.Name.Trim();
    student.Department = validDepartment;
    student.Email = input.Email.Trim();

    return Results.Ok(student);
});

// DELETE: Remove the chosen student using their ID.
app.MapDelete("/api/students/{id:int}", (int id) =>
{
    var student = students.FirstOrDefault(s => s.Id == id);
    if (student == null)
        return Results.NotFound("Student not found.");

    students.Remove(student);
    return Results.NoContent();
});

app.Run();

// Only these two department names are allowed.
static string? NormaliseDepartment(string? department)
{
    if (string.Equals(department?.Trim(), "Software Engineering", StringComparison.OrdinalIgnoreCase))
        return "Software Engineering";

    if (string.Equals(department?.Trim(), "Information Technology", StringComparison.OrdinalIgnoreCase))
        return "Information Technology";

    return null;
}

static bool ValidStudent(StudentInput input) =>
    !string.IsNullOrWhiteSpace(input.Name) &&
    !string.IsNullOrWhiteSpace(input.Email) &&
    input.Email.Contains('@');

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

// The fields received from the website or Swagger when adding/editing students.
record StudentInput(string Name, string Department, string Email);
