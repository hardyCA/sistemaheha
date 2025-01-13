// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA6ExAyc_J_znxfQ5n6QpCqq8_iZR1g-j0",
  authDomain: "sitemaheha.firebaseapp.com",
  projectId: "sitemaheha",
  storageBucket: "sitemaheha.firebasestorage.app",
  messagingSenderId: "737521831859",
  appId: "1:737521831859:web:e104c40c8b4ad15d54c5c6",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos del DOM
const ingredientForm = document.getElementById("ingredientForm");
const ingredientList = document.getElementById("ingredientList");
const dishForm = document.getElementById("dishForm");
const ingredientsListDiv = document.getElementById("ingredientsList");
const dishList = document.getElementById("dishList");
const saleForm = document.getElementById("saleForm");
const dishesListDiv = document.getElementById("dishesList");
const salesList = document.getElementById("salesList");
const reportContent = document.getElementById("reportContent");

let isEditing = false;
let currentIngredientId = "";
let currentDishId = "";
let ingredientData = [];
let dishData = [];

// Función para mostrar mensajes de error
const showError = (error) => {
  alert(`Error: ${error.message}`);
};

// Función para mostrar mensajes de confirmación
const showConfirmation = (message, callback) => {
  if (confirm(message)) {
    callback();
  }
};

// Función para registrar ingrediente
const addIngredient = async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const precioCompra = parseFloat(
    document.getElementById("precioCompra").value
  );
  const unidad = document.getElementById("unidad").value;
  const porciones = parseInt(document.getElementById("porciones").value, 10);
  const costoPorPorcion = precioCompra / porciones;

  try {
    await db.collection("ingredientes").add({
      nombre,
      precioCompra,
      unidad,
      porciones,
      costoPorPorcion,
    });
    alert("Ingrediente registrado con éxito");
    ingredientForm.reset();
  } catch (error) {
    showError(error);
  }
};

// Función para actualizar ingrediente y actualizar platillos relacionados
const updateIngredient = async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const precioCompra = parseFloat(
    document.getElementById("precioCompra").value
  );
  const unidad = document.getElementById("unidad").value;
  const porciones = parseInt(document.getElementById("porciones").value, 10);
  const costoPorPorcion = precioCompra / porciones;

  try {
    await db.collection("ingredientes").doc(currentIngredientId).update({
      nombre,
      precioCompra,
      unidad,
      porciones,
      costoPorPorcion,
    });

    const platillosSnapshot = await db.collection("platillos").get();
    platillosSnapshot.forEach(async (doc) => {
      const platillo = doc.data();
      const ingredientesActualizados = platillo.ingredientes.map((ing) => {
        if (ing.id === currentIngredientId) {
          ing.costoPorPorcion = costoPorPorcion;
        }
        return ing;
      });

      const costoTotalIngredientes = ingredientesActualizados.reduce(
        (total, ing) => {
          const ingrediente = ingredientData.find((i) => i.id === ing.id);
          return total + ingrediente.costoPorPorcion * ing.cantidad;
        },
        0
      );
      const ganancia = platillo.precioVenta - costoTotalIngredientes;

      await db.collection("platillos").doc(doc.id).update({
        costoTotalIngredientes,
        ganancia,
        ingredientes: ingredientesActualizados,
      });
    });

    alert("Ingrediente y platillos relacionados actualizados con éxito");
    ingredientForm.reset();
    isEditing = false;
    currentIngredientId = "";
    document.getElementById("submitButton").textContent = "Registrar";
    ingredientForm.removeEventListener("submit", updateIngredient);
    ingredientForm.addEventListener("submit", addIngredient);
  } catch (error) {
    showError(error);
  }
};

// Leer ingredientes en tiempo real
db.collection("ingredientes").onSnapshot((snapshot) => {
  ingredientList.innerHTML = "";
  ingredientsListDiv.innerHTML = "";
  ingredientData = [];
  snapshot.forEach((doc) => {
    const ingredient = doc.data();
    ingredientData.push({ id: doc.id, ...ingredient });
    const li = document.createElement("li");
    li.classList.add(
      "bg-white",
      "p-2",
      "border",
      "mb-2",
      "flex",
      "justify-between"
    );
    li.innerHTML = `
      <span>
        <strong>${ingredient.nombre}</strong> - ${
      ingredient.precioCompra
    } Bs - ${ingredient.unidad} - ${ingredient.porciones} porciones
        <br>
        <small>Costo por porción: ${ingredient.costoPorPorcion.toFixed(
          2
        )} Bs</small>
      </span>
      <div>
        <button class="bg-yellow-500 text-white px-2 py-1 rounded mr-2" onclick="editIngredient('${
          doc.id
        }', '${ingredient.nombre}', '${ingredient.precioCompra}', '${
      ingredient.unidad
    }', '${ingredient.porciones}')">Editar</button>
        <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteIngredient('${
          doc.id
        }')">Eliminar</button>
      </div>
    `;
    ingredientList.appendChild(li);

    const ingredientDiv = document.createElement("div");
    ingredientDiv.classList.add("flex", "items-center", "mb-2");
    ingredientDiv.innerHTML = `
      <input type="checkbox" id="ingredient_${doc.id}" class="mr-2">
      <label for="ingredient_${doc.id}" class="mr-2">${ingredient.nombre}</label>
      <input type="number" id="cantidad_${doc.id}" placeholder="Cantidad" class="block w-full p-2 border rounded">
    `;
    ingredientsListDiv.appendChild(ingredientDiv);
  });
});

// Eliminar ingrediente
window.deleteIngredient = async (id) => {
  showConfirmation(
    "¿Estás seguro de que deseas eliminar este ingrediente?",
    async () => {
      try {
        await db.collection("ingredientes").doc(id).delete();
        alert("Ingrediente eliminado con éxito");
      } catch (error) {
        showError(error);
      }
    }
  );
};

// Editar ingrediente
window.editIngredient = (id, nombre, precioCompra, unidad, porciones) => {
  document.getElementById("nombre").value = nombre;
  document.getElementById("precioCompra").value = precioCompra;
  document.getElementById("unidad").value = unidad;
  document.getElementById("porciones").value = porciones;

  isEditing = true;
  currentIngredientId = id;
  document.getElementById("submitButton").textContent = "Modificar";

  ingredientForm.removeEventListener("submit", addIngredient);
  ingredientForm.addEventListener("submit", updateIngredient);
};

// Inicializar el evento de añadir ingrediente
ingredientForm.addEventListener("submit", addIngredient);

// Función para registrar platillo
const addDish = async (e) => {
  e.preventDefault();

  const nombrePlatillo = document.getElementById("nombrePlatillo").value;
  const precioVenta = parseFloat(document.getElementById("precioVenta").value);
  const selectedIngredients = [];
  let costoTotalIngredientes = 0;

  ingredientData.forEach((ingredient) => {
    const isChecked = document.getElementById(
      `ingredient_${ingredient.id}`
    ).checked;
    const cantidad = parseFloat(
      document.getElementById(`cantidad_${ingredient.id}`).value
    );

    if (isChecked && !isNaN(cantidad) && cantidad > 0) {
      selectedIngredients.push({
        id: ingredient.id,
        cantidad,
      });
      costoTotalIngredientes += ingredient.costoPorPorcion * cantidad;
    }
  });

  const ganancia = precioVenta - costoTotalIngredientes;

  try {
    await db.collection("platillos").add({
      nombre: nombrePlatillo,
      precioVenta,
      costoTotalIngredientes,
      ganancia,
      ingredientes: selectedIngredients,
    });
    alert("Platillo registrado con éxito");
    dishForm.reset();
  } catch (error) {
    showError(error);
  }
};

// Leer platillos en tiempo real
db.collection("platillos").onSnapshot((snapshot) => {
  dishList.innerHTML = "";
  dishData = [];
  snapshot.forEach((doc) => {
    const dish = doc.data();
    dishData.push({ id: doc.id, ...dish });
    const li = document.createElement("li");
    li.classList.add(
      "bg-white",
      "p-2",
      "border",
      "mb-2",
      "flex",
      "justify-between"
    );
    li.innerHTML = `
      <span>
        <strong>${dish.nombre}</strong> - ${dish.precioVenta} Bs
        <br>
        <small>Costo Total de Ingredientes: ${dish.costoTotalIngredientes.toFixed(
          2
        )} Bs</small>
        <br>
        <small>Ganancia: ${dish.ganancia.toFixed(2)} Bs</small>
        <br>
        <small>Ingredientes:</small>
        <ul>
          ${dish.ingredientes
            .map((ing) => {
              const ingredient = ingredientData.find((i) => i.id === ing.id);
              return `<li>${ingredient ? ingredient.nombre : "Desconocido"}: ${
                ing.cantidad
              }</li>`;
            })
            .join("")}
        </ul>
      </span>
      <div>
        <button class="bg-yellow-500 text-white px-2 py-1 rounded mr-2" onclick="editDish('${
          doc.id
        }', '${dish.nombre}', '${dish.precioVenta}', '${JSON.stringify(
      dish.ingredientes
    )}')">Editar</button>
        <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteDish('${
          doc.id
        }')">Eliminar</button>
      </div>
    `;
    dishList.appendChild(li);

    const dishDiv = document.createElement("div");
    dishDiv.classList.add("flex", "items-center", "mb-2");
    dishDiv.innerHTML = `
      <input type="checkbox" id="dish_${doc.id}" class="mr-2">
      <label for="dish_${doc.id}" class="mr-2">${dish.nombre}</label>
      <input type="number" id="cantidad_dish_${doc.id}" placeholder="Cantidad" class="block w-full p-2 border rounded">
    `;
    dishesListDiv.appendChild(dishDiv);
  });
});

// Eliminar platillo
window.deleteDish = async (id) => {
  showConfirmation(
    "¿Estás seguro de que deseas eliminar este platillo?",
    async () => {
      try {
        await db.collection("platillos").doc(id).delete();
        alert("Platillo eliminado con éxito");
      } catch (error) {
        showError(error);
      }
    }
  );
};

// Editar platillo
window.editDish = (id, nombre, precioVenta, ingredientes) => {
  document.getElementById("nombrePlatillo").value = nombre;
  document.getElementById("precioVenta").value = precioVenta;

  const ingredientesParsed = JSON.parse(ingredientes);
  ingredientesParsed.forEach((ing) => {
    document.getElementById(`ingredient_${ing.id}`).checked = true;
    document.getElementById(`cantidad_${ing.id}`).value = ing.cantidad;
  });

  isEditing = true;
  currentDishId = id;
  document.getElementById("submitButtonPlatillo").textContent = "Modificar";

  dishForm.removeEventListener("submit", addDish);
  dishForm.addEventListener("submit", updateDish);
};

// Función para actualizar platillo
const updateDish = async (e) => {
  e.preventDefault();

  const nombrePlatillo = document.getElementById("nombrePlatillo").value;
  const precioVenta = parseFloat(document.getElementById("precioVenta").value);
  const selectedIngredients = [];
  let costoTotalIngredientes = 0;

  ingredientData.forEach((ingredient) => {
    const isChecked = document.getElementById(
      `ingredient_${ingredient.id}`
    ).checked;
    const cantidad = parseFloat(
      document.getElementById(`cantidad_${ingredient.id}`).value
    );

    if (isChecked && !isNaN(cantidad) && cantidad > 0) {
      selectedIngredients.push({
        id: ingredient.id,
        cantidad,
      });
      costoTotalIngredientes += ingredient.costoPorPorcion * cantidad;
    }
  });

  const ganancia = precioVenta - costoTotalIngredientes;

  try {
    await db.collection("platillos").doc(currentDishId).update({
      nombre: nombrePlatillo,
      precioVenta,
      costoTotalIngredientes,
      ganancia,
      ingredientes: selectedIngredients,
    });
    alert("Platillo actualizado con éxito");
    dishForm.reset();
    isEditing = false;
    currentDishId = "";
    document.getElementById("submitButtonPlatillo").textContent =
      "Registrar Platillo";
    dishForm.removeEventListener("submit", updateDish);
    dishForm.addEventListener("submit", addDish);
  } catch (error) {
    showError(error);
  }
};

// Inicializar el evento de añadir platillo
dishForm.addEventListener("submit", addDish);

// Función para registrar venta
const addSale = async (e) => {
  e.preventDefault();

  const selectedDishes = [];
  dishData.forEach((dish) => {
    const isChecked = document.getElementById(`dish_${dish.id}`).checked;
    const cantidad = parseFloat(
      document.getElementById(`cantidad_dish_${dish.id}`).value
    );

    if (isChecked && !isNaN(cantidad) && cantidad > 0) {
      selectedDishes.push({
        id: dish.id,
        cantidad,
      });
    }
  });

  const ingresoTotal = selectedDishes.reduce((total, dish) => {
    const dishInfo = dishData.find((d) => d.id === dish.id);
    return total + dishInfo.precioVenta * dish.cantidad;
  }, 0);

  try {
    await db.collection("ventas").add({
      fecha: new Date(),
      platillos: selectedDishes,
      ingresoTotal,
    });
    alert("Venta registrada con éxito");
    saleForm.reset();
  } catch (error) {
    showError(error);
  }
};

// Leer ventas en tiempo real
db.collection("ventas").onSnapshot((snapshot) => {
  salesList.innerHTML = "";
  let totalIngresos = 0;
  let totalGastos = 0;

  snapshot.forEach((doc) => {
    const sale = doc.data();
    totalIngresos += sale.ingresoTotal;

    sale.platillos.forEach((p) => {
      const dish = dishData.find((d) => d.id === p.id);
      if (dish) {
        dish.ingredientes.forEach((ing) => {
          const ingredient = ingredientData.find((i) => i.id === ing.id);
          if (ingredient) {
            totalGastos +=
              ingredient.costoPorPorcion * ing.cantidad * p.cantidad;
          }
        });
      }
    });

    const li = document.createElement("li");
    li.classList.add(
      "bg-white",
      "p-2",
      "border",
      "mb-2",
      "flex",
      "justify-between"
    );
    li.innerHTML = `
      <span>
        <strong>${new Date(
          sale.fecha.seconds * 1000
        ).toLocaleString()}</strong> - ${sale.ingresoTotal} Bs
        <br>
        <small>Platillos vendidos:</small>
        <ul>
          ${sale.platillos
            .map((p) => {
              const dish = dishData.find((d) => d.id === p.id);
              return `<li>${dish ? dish.nombre : "Desconocido"}: ${
                p.cantidad
              }</li>`;
            })
            .join("")}
        </ul>
      </span>
      <div>
        <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteSale('${
          doc.id
        }')">Eliminar</button>
      </div>
    `;
    salesList.appendChild(li);
  });

  const totalGanancias = totalIngresos - totalGastos;
  reportContent.innerHTML = `
    <p><strong>Ingresos Totales:</strong> ${totalIngresos} Bs</p>
    <p><strong>Gastos Totales:</strong> ${totalGastos} Bs</p>
    <p><strong>Ganancias Netas:</strong> ${totalGanancias} Bs</p>
  `;
});

// Eliminar venta
window.deleteSale = async (id) => {
  showConfirmation(
    "¿Estás seguro de que deseas eliminar esta venta?",
    async () => {
      try {
        await db.collection("ventas").doc(id).delete();
        alert("Venta eliminada con éxito");
      } catch (error) {
        showError(error);
      }
    }
  );
};

// Inicializar el evento de añadir venta
saleForm.addEventListener("submit", addSale);
