
const API_URL = "http://localhost:5233/api/students";

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");
const message = document.getElementById("message");

let editingId = null;

// GET: Display all students
async function loadStudents() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load students");
        }

        const students = await response.json();

        table.innerHTML = "";

        students.forEach(student => {
            const row = document.createElement("tr");

            // Create cells safely
            [
                student.id,
                student.name,
                student.department,
                student.email
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.onclick = () => editStudent(student);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete";
            deleteButton.onclick = () => deleteStudent(student.id);

            actions.append(editButton, deleteButton);
            row.appendChild(actions);
            table.appendChild(row);
        });

    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
}

// POST or PUT: Save student information
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const student = {
        name: document.getElementById("name").value.trim(),
        department: document.getElementById("department").value.trim(),
        email: document.getElementById("email").value.trim()
    };

    const isEditing = editingId !== null;

    const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            throw new Error("Could not save student");
        }

        resetForm();

        message.textContent = isEditing
            ? "Student updated successfully!"
            : "Student added successfully!";

        await loadStudents();

    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
});

// Fill the form with existing student details
function editStudent(student) {
    editingId = student.id;

    document.getElementById("name").value = student.name;
    document.getElementById("department").value = student.department;
    document.getElementById("email").value = student.email;

    document.getElementById("formTitle").textContent = "Edit Student";
    document.getElementById("saveButton").textContent = "Save Changes";
    document.getElementById("cancelButton").hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// DELETE: Remove a student
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete student");
        }

        if (editingId === id) {
            resetForm();
        }

        message.textContent = "Student deleted successfully!";
        await loadStudents();

    } catch (error) {
        message.textContent = "Error: " + error.message;
    }
}

// Reset the form after saving or cancelling
function resetForm() {
    editingId = null;
    form.reset();

    document.getElementById("formTitle").textContent = "Add Student";
    document.getElementById("saveButton").textContent = "Add Student";
    document.getElementById("cancelButton").hidden = true;
}

document.getElementById("cancelButton").onclick = resetForm;

// Load student records when the page opens
loadStudents();
