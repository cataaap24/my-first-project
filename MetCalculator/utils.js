// ============================================
// UTILS.JS - Código Reutilizable para Métodos Numéricos
// ============================================

// Variable global para el método actual
let currentMethod = 'muller';

// ==================== EVALUACIÓN DE FUNCIONES ====================

/**
 * Crea una función evaluable usando MathJS
 * @param {string} userInput - Expresión matemática
 * @returns {Function} Función que evalúa x
 */
function createFunction(userInput) {
    return (x) => {
        try {
            return math.evaluate(userInput, {x: x});
        } catch (error) {
            console.error("Error evaluating function:", error);
            return NaN;
        }
    };
}

/**
 * Evalúa una función en un punto específico
 * @param {string} expression - Expresión matemática
 * @param {number} x - Valor a evaluar
 * @returns {number} Resultado de f(x)
 */
function evaluateFunction(expression, x) {
    try {
        const f = createFunction(expression);
        const result = f(x);
        
        if (isNaN(result) || !isFinite(result)) {
            throw new Error(`Resultado no finito para x = ${x}`);
        }
        
        return result;
    } catch (error) {
        console.error('Error en evaluateFunction:', error);
        throw new Error(`Error en f(${x}): ${error.message}`);
    }
}

// Función para obtener la derivada como string (para mostrar)
function getDerivativeString(functionStr) {
    try {
        const derivative = math.derivative(functionStr, 'x');
        return derivative.toString();
    } catch (error) {
        console.error("Error computing derivative string:", error);
        return "No se pudo calcular la derivada";
    }
}

/**
 * Valida si una función es evaluable
 * @param {string} expression - Expresión matemática
 * @returns {Object} {valid: boolean, message: string}
 */
function validateFunction(expression) {
    try {
        const f = createFunction(expression);
        const testValues = [0, 1, -1, 0.5, 2, -2];
        let validCount = 0;
        
        for (let testX of testValues) {
            try {
                const result = f(testX);
                if (!isNaN(result) && isFinite(result)) {
                    validCount++;
                }
            } catch (e) {
                // Continuar probando otros valores
            }
        }
        
        if (validCount >= 3) {
            return { valid: true, message: "Función válida" };
        } else {
            return { valid: false, message: "Función inválida o sin valores finitos" };
        }
    } catch (error) {
        return { valid: false, message: "Error de sintaxis: " + error.message };
    }
}

// ==================== FUNCIONES DE INTERFAZ ====================

/**
 * Muestra preview de validación de función
 */
function previewFunction() {
    const expression = document.getElementById('functionInput').value;
    const validation = validateFunction(expression);
    
    let preview = document.getElementById('function-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'function-preview';
        preview.className = 'function-preview';
        document.getElementById('functionInput').parentNode.appendChild(preview);
    }
    
    if (validation.valid) {
        let previewHTML = `<span style="color: #38a169;">✓ ${validation.message}</span><br>Función: ${expression}`;
        
        // Mostrar derivada para el método de Newton
        if (currentMethod === 'newton') {
            const derivativeStr = getDerivativeString(expression);
            previewHTML += `<br>Derivada: f'(x) = ${derivativeStr}`;
        }
        
        preview.innerHTML = previewHTML;
        preview.style.borderColor = '#68d391';
        preview.style.backgroundColor = '#f0fff4';
    } else {
        preview.innerHTML = `<span style="color: #e53e3e;">✗ ${validation.message}</span>`;
        preview.style.borderColor = '#fc8181';
        preview.style.backgroundColor = '#fed7d7';
    }
}

// ==================== VALIDACIÓN DE INPUTS ====================

/**
 * Valida inputs numéricos básicos
 * @param {Object} inputs - Objeto con valores a validar
 * @returns {Object} {valid: boolean, message: string}
 */
function validateNumericInputs(inputs) {
    for (const [key, value] of Object.entries(inputs)) {
        if (value === '' || value === null || value === undefined) {
            return { valid: false, message: `Por favor, completa el campo ${key}` };
        }
        
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return { valid: false, message: `${key} debe ser un número válido` };
        }
        
        if (!isFinite(numValue)) {
            return { valid: false, message: `${key} debe ser un número finito` };
        }
    }
    
    return { valid: true, message: "Inputs válidos" };
}

/**
 * Valida puntos iniciales diferentes
 * @param {Array} points - Array de puntos a verificar
 * @returns {Object} {valid: boolean, message: string}
 */
function validateDifferentPoints(points) {
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (Math.abs(points[i] - points[j]) < 1e-10) {
                return { valid: false, message: `Los puntos deben ser diferentes` };
            }
        }
    }
    return { valid: true, message: "Puntos válidos" };
}

// ==================== GRAFICACIÓN ====================

/**
 * Grafica una función con puntos iniciales y raíz
 * @param {string} functionStr - Expresión matemática
 * @param {number|null} root - Raíz encontrada
 * @param {Object|null} initialPoints - Puntos iniciales {x0, x1, x2}
 * @param {string} canvasId - ID del canvas
 * @returns {Chart} Instancia de Chart.js
 */
function plotFunction(functionStr, root = null, initialPoints = null, canvasId = 'functionChart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas ${canvasId} no encontrado`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfica anterior si existe
    if (window.currentChart) {
        window.currentChart.destroy();
    }

    try {
        // Determinar rango de graficación
        let start, end;
        
        if (root !== null) {
            start = root - 3;
            end = root + 3;
        } else if (initialPoints) {
            const allX = Object.values(initialPoints).filter(x => typeof x === 'number');
            start = Math.min(...allX) - 2;
            end = Math.max(...allX) + 2;
        } else {
            start = -5;
            end = 5;
        }
        
        // Generar puntos de la función
        const points = [];
        const step = (end - start) / 300;
        let minY = Infinity, maxY = -Infinity;

        for (let x = start; x <= end; x += step) {
            try {
                const y = evaluateFunction(functionStr, x);
                if (isFinite(y) && Math.abs(y) < 1e6) {
                    points.push({ x: x, y: y });
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            } catch (e) {
                // Skip invalid points
            }
        }
        
        // Ajustar rango Y con margen
        const yMargin = (maxY - minY) * 0.1;
        minY -= yMargin;
        maxY += yMargin;

        const datasets = [
            {
                label: 'f(x)',
                data: points,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                pointRadius: 0
            },
            {
                label: 'y = 0',
                data: [{ x: start, y: 0 }, { x: end, y: 0 }],
                borderColor: '#e53e3e',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }
        ];

        // Agregar puntos iniciales
        if (initialPoints) {
            const initialPointsData = [];
            for (const [key, x] of Object.entries(initialPoints)) {
                if (typeof x === 'number') {
                    try {
                        const y = evaluateFunction(functionStr, x);
                        initialPointsData.push({ x: x, y: y });
                    } catch (e) {
                        console.warn(`No se pudo evaluar punto inicial ${key}:`, e);
                    }
                }
            }
            
            if (initialPointsData.length > 0) {
                datasets.push({
                    label: 'Puntos iniciales',
                    data: initialPointsData,
                    backgroundColor: '#f6ad55',
                    borderColor: '#ed8936',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false,
                    pointStyle: 'triangle',
                    borderWidth: 2
                });
            }
        }

        // Agregar raíz encontrada
        if (root !== null) {
            try {
                const rootY = evaluateFunction(functionStr, root);
                datasets.push({
                    label: `Raíz (${root.toFixed(6)})`,
                    data: [{ x: root, y: rootY }],
                    backgroundColor: '#38a169',
                    borderColor: '#2d7d32',
                    pointRadius: 12,
                    pointHoverRadius: 15,
                    showLine: false,
                    pointStyle: 'star',
                    borderWidth: 3
                });
            } catch (error) {
                console.warn('Error al agregar raíz:', error);
            }
        }

        window.currentChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: start,
                        max: end,
                        title: {
                            display: true,
                            text: 'x',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    y: {
                        min: minY,
                        max: maxY,
                        title: {
                            display: true,
                            text: 'y',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: '#e2e8f0'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Análisis Gráfico - Método Numérico',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return `x = ${context[0].parsed.x.toFixed(6)}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(6)}`;
                            }
                        }
                    }
                }
            }
        });
        
        return window.currentChart;
        
    } catch (error) {
        console.error('Error en plotFunction:', error);
        return null;
    }
}

// ==================== GENERACIÓN DE TABLAS ====================

/**
 * Genera tabla HTML de resultados
 * @param {Array} iterations - Array de iteraciones
 * @param {Array} headers - Encabezados de la tabla
 * @param {number} decimals - Número de decimales
 * @returns {string} HTML de la tabla
 */
function generateIterationTable(iterations, headers, decimals = 6) {
    let html = '<div class="table-container"><table>';
    html += '<thead><tr>';
    headers.forEach(header => html += `<th>${header}</th>`);
    html += '</tr></thead><tbody>';

    iterations.forEach(row => {
        html += '<tr>';
        Object.values(row).forEach((val, index) => {
            if (val === null || val === undefined) {
                html += '<td>---</td>';
            } else if (typeof val === 'number') {
                if (index === 0 || headers[index].toLowerCase().includes('iter')) {
                    html += `<td>${Math.floor(val)}</td>`;
                } else {
                    html += `<td>${val.toFixed(decimals)}</td>`;
                }
            } else {
                html += `<td>${val}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

/**
 * Genera resumen de resultados
 * @param {Object} results - Objeto con resultados
 * @param {number} decimals - Número de decimales
 * @returns {string} HTML del resumen
 */
function generateResultsSummary(results, decimals) {
    let html = '<div style="margin-top: 1rem; padding: 1rem; border-radius: 4px;">';
    
    if (results.converged) {
        html += `<div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 1rem;">`;
        html += `<div class="success">Convergencia alcanzada en ${results.iterations.length} iteraciones</div>`;
        html += `<div><strong>Raíz encontrada:</strong> x = ${results.root.toFixed(decimals)}</div>`;
        if (results.functionValue !== undefined) {
            html += `<div><strong>f(raíz) ≈</strong> ${results.functionValue.toExponential(3)}</div>`;
        }
        html += '</div>';
    } else if (results.error) {
        html += `<div style="background: #fed7d7; border-left: 4px solid #e53e3e; padding: 1rem;">`;
        html += `<div class="error">Error: ${results.error}</div>`;
        html += '</div>';
    } else {
        html += `<div style="background: #fef5e7; border-left: 4px solid #d69e2e; padding: 1rem;">`;
        html += `<div class="warning">Máximo de iteraciones alcanzado</div>`;
        html += `<div><strong>Mejor aproximación:</strong> x = ${results.root.toFixed(decimals)}</div>`;
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// ==================== FUNCIONES AUXILIARES ====================
function getInitialPoints(method, currentValues = {}) {
    try {
        switch(method) {
            case 'muller':
                return {
                    x0: currentValues.x0 || parseFloat(document.getElementById('method-x0')?.value || 1),
                    x1: currentValues.x1 || parseFloat(document.getElementById('method-x1')?.value || 1.5),
                    x2: currentValues.x2 || parseFloat(document.getElementById('method-x2')?.value || 2)
                };
            case 'secant':
                return {
                    x0: currentValues.x0 || parseFloat(document.getElementById('method-x0')?.value || 2),
                    x1: currentValues.x1 || parseFloat(document.getElementById('method-x1')?.value || 3)
                };
            case 'bisection':
                return {
                    a: currentValues.a || parseFloat(document.getElementById('method-a')?.value || 0),
                    b: currentValues.b || parseFloat(document.getElementById('method-b')?.value || 1)
                };
            case 'newton':
                return {
                    x0: currentValues.x0 || parseFloat(document.getElementById('method-x0')?.value || 2)
                };  
            default:
                return {};
            }
    } catch (error) {
        console.error('Error obteniendo puntos iniciales:', error);
        return {};
    }
}


/**
  Grafica la función inicial del método actual
 */
function plotInitialFunction() {
    try {
        const functionStr = document.getElementById('functionInput').value;
        const method = document.getElementById('methodSelect').value;
        const initialPoints = getInitialPoints(method, {});
        plotFunction(functionStr, null, initialPoints, 'functionChart');
    } catch (error) {
        console.error('Error al graficar función inicial:', error);
    }
}

// ==================== INICIALIZACIÓN COMPLETA ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando formulario dinámico...');

    // Inicializar formulario con el primer método
    updateFormForMethod('muller');
    plotInitialFunction();

    //  Evento: vista previa mientras se escribe 
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
        functionInput.addEventListener('input', previewFunction);
    }

    // Evento: cambio de método 
    const methodSelect = document.getElementById('methodSelect');
    if (methodSelect) {
        methodSelect.addEventListener('change', function() {
            updateFormForMethod(this.value);
            plotInitialFunction(); // Actualizar gráfica según método
        });
    }

    // Evento: envío del formulario 
    const dynamicForm = document.getElementById('dynamic-form');
    if (dynamicForm) {
        dynamicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const method = document.getElementById('methodSelect').value;
            methodConfig[method].handler(e);
        });
    }

    // Configurar OCR 
    setupOCR();
});

 // ==================== FORMULARIO DINÁMICO ====================
// Actualiza el formulario según el método seleccionado
 function updateFormForMethod(method) {
    const config = methodConfig[method];
    
    // Actualizar función de ejemplo
    document.getElementById('functionInput').value = config.functionValue;
    
    // Actualizar botones de ejemplo
    const exampleButtons = document.getElementById('exampleButtons');
    exampleButtons.innerHTML = '';
    
    config.examples.forEach(example => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'example-btn';
        button.textContent = example.text;
        button.onclick = () => setFunction(example.value);
        exampleButtons.appendChild(button);
    });
    
    // Actualizar campos específicos del método
    const methodFields = document.getElementById('method-specific-fields');
    methodFields.innerHTML = '';
    
    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    
    config.fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        // Usar name en lugar de id para evitar duplicados
        label.htmlFor = `method-${field.id}`; // ID único para cada campo
        label.textContent = field.label;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `method-${field.id}`; // ID único por método
        input.name = field.id; // name para FormData
        input.value = field.value;
        input.step = '0.01';
        input.min = '-1000';
        input.max = '1000';
        input.required = field.required;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formRow.appendChild(formGroup);
    });
    
    methodFields.appendChild(formRow);
}
// ==================== FUNCIONALIDAD COMÚN ====================
// Establece la función en el campo de entrada
function setFunction(value) {
    document.getElementById('functionInput').value = value;
    plotInitialFunction(); 
}
// Exportar si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createFunction,
        evaluateFunction,
        validateFunction,
        setFunction,
        previewFunction,
        validateNumericInputs,
        validateDifferentPoints,
        plotFunction,
        generateIterationTable,
        generateResultsSummary,
        getInitialPoints,
        plotInitialFunction,
        currentMethod
    };
}