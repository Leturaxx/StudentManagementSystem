const API_URL = "http://localhost:5233/api/students";

const form = document.getElementById("studentForm");
const softwareTable = document.getElementById("softwareTable");
const itTable = document.getElementById("itTable");
const message = document.getElementById("message");

let editingId = null;

// Make table cells without treating student names as HTML code.
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

function makeRow(student) {
    const row = document.createElement("tr");
    addCell(row, student.id);
    addCell(row, student.name);
    addCell(row, student.department);
    addCell(row, student.email);

    const actions = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.type = "button";
    editButton.onclick = () => editStudent(student);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";
    deleteButton.className = "delete";
    deleteButton.onclick = () => deleteStudent(student.id);

    actions.append(editButton, deleteButton);
    row.appendChild(actions);
    return row;
}

function showEmptyRow(table) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-row";
    cell.textContent = "No students in this department yet.";
    row.appendChild(cell);
    table.appendChild(row);
}

// READ: Load all students and separate them into two department tables.
async function loadStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load students.");

        const students = await response.json();
        const software = students.filter(s => s.department === "Software Engineering");
        const it = students.filter(s => s.department === "Information Technology");

        softwareTable.replaceChildren();
        itTable.replaceChildren();

        software.forEach(student => softwareTable.appendChild(makeRow(student)));
        it.forEach(student => itTable.appendChild(makeRow(student)));
        if (software.length === 0) showEmptyRow(softwareTable);
        if (it.length === 0) showEmptyRow(itTable);

        document.getElementById("softwareCount").textContent = `${software.length} students`;
        document.getElementById("itCount").textContent = `${it.length} students`;
        document.getElementById("totalCount").textContent = `${students.length} students`;
    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
}

// CREATE or UPDATE: Save the student, including their department.
form.addEventListener("submit", async function(event) {
    event.preventDefault();
    const student = {
        name: document.getElementById("name").value.trim(),
        department: document.getElementById("department").value,
        email: document.getElementById("email").value.trim()
    };
    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

    try {
        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });
        if (!response.ok) throw new Error("Could not save student.");

        resetForm();
        await loadStudents();
        message.textContent = isEditing ? "Student updated successfully!" : "Student added successfully!";
    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
});

function editStudent(student) {
    editingId = student.id;
    document.getElementById("name").value = student.name;
    document.getElementById("department").value = student.department;
    document.getElementById("email").value = student.email;
    document.getElementById("formTitle").textContent = "Update Student Profile";
    document.getElementById("saveButton").textContent = "Save Changes";
    document.getElementById("cancelButton").hidden = false;
    document.querySelector(".registration-card").scrollIntoView({ behavior: "smooth" });
}

// DELETE: Remove a student by their unique ID.
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete student.");

        if (editingId === id) resetForm();
        await loadStudents();
        message.textContent = "Student deleted successfully!";
    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
}

function resetForm() {
    editingId = null;
    form.reset();
    document.getElementById("formTitle").textContent = "Student Registration";
    document.getElementById("saveButton").textContent = "Add Student";
    document.getElementById("cancelButton").hidden = true;
}

document.getElementById("cancelButton").onclick = resetForm;
loadStudents();
