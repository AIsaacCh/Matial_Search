let datosActuales = null;

// Elementos del DOM
const statusEl = document.getElementById('status');
const resultadoEl = document.getElementById('resultado');
const tituloEl = document.getElementById('titulo');
const urlEl = document.getElementById('url');
const contenidoEl = document.getElementById('contenido');
const caracteresEl = document.getElementById('caracteres');
const palabrasEl = document.getElementById('palabras');
const botonActualizar = document.getElementById('actualizar');
const botonGuardar = document.getElementById('guardar');
const botonVerGuardados = document.getElementById('verGuardados');
const botonDescargar = document.getElementById('descargar');
const botonAnalizar = document.getElementById('analizar');
const datosGuardadosEl = document.getElementById('datosGuardados');
const infoGuardadosEl = document.getElementById('infoGuardados');

// Función para mostrar estado
function mostrarEstado(tipo, mensaje) {
    statusEl.className = `status ${tipo}`;
    statusEl.textContent = mensaje;
}

// Función para extraer TODO el contenido de una página
async function extraerContenidoCompleto(url) {
    try {
        mostrarEstado('loading', 'Extrayendo contenido completo...');
        
        const response = await fetch(url);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extraer TODO el texto del body
        const body = doc.body;
        
        // Remover elementos no deseados
        const elementosRemover = body.querySelectorAll('script, style, noscript, iframe, svg');
        elementosRemover.forEach(el => el.remove());
        
        // Obtener texto completo
        const textoCompleto = body.innerText || body.textContent || '';
        
        // También extraer el HTML limpio
        const htmlLimpio = body.innerHTML;
        
        // Extraer metadatos
        const titulo = doc.querySelector('title')?.textContent || 'Sin título';
        const descripcion = doc.querySelector('meta[name="description"]')?.content || '';
        const keywords = doc.querySelector('meta[name="keywords"]')?.content || '';
        
        // Extraer todos los enlaces
        const enlaces = Array.from(doc.querySelectorAll('a[href]')).map(a => ({
            texto: a.textContent.trim(),
            url: a.href
        }));
        
        // Extraer todas las imágenes
        const imagenes = Array.from(doc.querySelectorAll('img[src]')).map(img => ({
            alt: img.alt,
            src: img.src
        }));
        
        return {
            url: url,
            titulo: titulo,
            descripcion: descripcion,
            keywords: keywords,
            textoCompleto: textoCompleto.trim(),
            htmlLimpio: htmlLimpio,
            enlaces: enlaces,
            imagenes: imagenes,
            fechaExtraccion: new Date().toISOString(),
            estadisticas: {
                caracteres: textoCompleto.length,
                palabras: textoCompleto.split(/\s+/).filter(p => p.length > 0).length,
                parrafos: textoCompleto.split(/\n\n+/).length,
                enlaces: enlaces.length,
                imagenes: imagenes.length
            }
        };
        
    } catch (error) {
        console.error('Error al extraer contenido:', error);
        throw new Error('No se pudo acceder al contenido. Puede estar bloqueado por CORS.');
    }
}

// Función para guardar datos en chrome.storage
async function guardarEnStorage(datos) {
    try {
        // Obtener datos existentes
        const result = await chrome.storage.local.get(['paginasGuardadas']);
        let paginasGuardadas = result.paginasGuardadas || [];
        
        // Agregar nuevos datos con ID único
        const nuevoRegistro = {
            id: Date.now(),
            ...datos
        };
        
        paginasGuardadas.push(nuevoRegistro);
        
        // Limitar a últimas 50 páginas para no llenar el storage
        if (paginasGuardadas.length > 50) {
            paginasGuardadas = paginasGuardadas.slice(-50);
        }
        
        // Guardar en storage
        await chrome.storage.local.set({ paginasGuardadas });
        
        mostrarEstado('success', '✅ Datos guardados exitosamente');
        
        // Mostrar info de guardados
        await mostrarDatosGuardados();
        
        return nuevoRegistro.id;
        
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarEstado('error', 'Error al guardar los datos');
    }
}

// Función para mostrar datos guardados
async function mostrarDatosGuardados() {
    try {
        const result = await chrome.storage.local.get(['paginasGuardadas']);
        const paginas = result.paginasGuardadas || [];
        
        if (paginas.length === 0) {
            infoGuardadosEl.textContent = 'No hay datos guardados';
        } else {
            const totalCaracteres = paginas.reduce((sum, p) => sum + p.estadisticas.caracteres, 0);
            infoGuardadosEl.innerHTML = `
                <div>Total páginas: ${paginas.length}</div>
                <div>Total caracteres: ${totalCaracteres.toLocaleString()}</div>
                <div>Última guardada: ${new Date(paginas[paginas.length - 1].fechaExtraccion).toLocaleString()}</div>
            `;
        }
        
        datosGuardadosEl.style.display = 'block';
        
    } catch (error) {
        console.error('Error al mostrar guardados:', error);
    }
}

// Función para analizar datos (aquí puedes agregar tu lógica)
function analizarDatos(datos) {
    console.log('=== ANÁLISIS DE DATOS ===');
    console.log('URL:', datos.url);
    console.log('Título:', datos.titulo);
    console.log('Estadísticas:', datos.estadisticas);
    
    // Análisis de palabras más frecuentes
    const palabras = datos.textoCompleto.toLowerCase().split(/\s+/);
    const frecuencias = {};
    
    palabras.forEach(palabra => {
        // Limpiar palabra
        palabra = palabra.replace(/[^\wáéíóúñ]/g, '');
        if (palabra.length > 3) { // Solo palabras de más de 3 letras
            frecuencias[palabra] = (frecuencias[palabra] || 0) + 1;
        }
    });
    
    // Top 10 palabras más frecuentes
    const topPalabras = Object.entries(frecuencias)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    console.log('Top 10 palabras:', topPalabras);
    
    // Buscar emails
    const emails = datos.textoCompleto.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    console.log('Emails encontrados:', emails);
    
    // Buscar números de teléfono (formato simple)
    const telefonos = datos.textoCompleto.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/g) || [];
    console.log('Teléfonos encontrados:', telefonos);
    
    // Mostrar análisis en popup
    mostrarEstado('success', `✅ Análisis completado. Ver consola (F12)`);
    
    alert(`ANÁLISIS COMPLETADO:\n\n` +
          `Palabras totales: ${datos.estadisticas.palabras}\n` +
          `Caracteres: ${datos.estadisticas.caracteres}\n` +
          `Enlaces: ${datos.estadisticas.enlaces}\n` +
          `Imágenes: ${datos.estadisticas.imagenes}\n\n` +
          `Palabra más frecuente: ${topPalabras[0]?.[0]} (${topPalabras[0]?.[1]} veces)\n` +
          `Emails encontrados: ${emails.length}\n` +
          `Teléfonos encontrados: ${telefonos.length}\n\n` +
          `Ver consola (F12) para detalles completos`);
    
    return {
        topPalabras,
        emails,
        telefonos,
        estadisticas: datos.estadisticas
    };
}

// Función para descargar como TXT
function descargarComoTXT(datos) {
    const contenidoTXT = `
TÍTULO: ${datos.titulo}
URL: ${datos.url}
FECHA: ${new Date(datos.fechaExtraccion).toLocaleString()}
DESCRIPCIÓN: ${datos.descripcion}

ESTADÍSTICAS:
- Caracteres: ${datos.estadisticas.caracteres}
- Palabras: ${datos.estadisticas.palabras}
- Párrafos: ${datos.estadisticas.parrafos}
- Enlaces: ${datos.estadisticas.enlaces}
- Imágenes: ${datos.estadisticas.imagenes}

======================================
CONTENIDO COMPLETO:
======================================

${datos.textoCompleto}

======================================
ENLACES ENCONTRADOS (${datos.enlaces.length}):
======================================

${datos.enlaces.map((e, i) => `${i + 1}. ${e.texto}\n   ${e.url}`).join('\n\n')}
    `.trim();
    
    const blob = new Blob([contenidoTXT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datos.titulo.substring(0, 50)}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarEstado('success', '✅ Archivo descargado');
}

// Función para mostrar el resultado
function mostrarResultado(datos) {
    tituloEl.textContent = datos.titulo;
    urlEl.textContent = datos.url;
    
    // Mostrar preview del contenido
    const preview = datos.textoCompleto.substring(0, 500) + '...';
    contenidoEl.textContent = preview;
    
    // Mostrar estadísticas
    caracteresEl.textContent = datos.estadisticas.caracteres.toLocaleString();
    palabrasEl.textContent = datos.estadisticas.palabras.toLocaleString();
    
    resultadoEl.style.display = 'block';
    mostrarEstado('success', ' Contenido extraído exitosamente');
    
    botonActualizar.disabled = false;
    botonGuardar.disabled = false;
    botonDescargar.disabled = false;
    botonAnalizar.disabled = false;
    
    // Guardar en variable global
    datosActuales = datos;
    
    // Log completo para el programador
    console.log('=== DATOS COMPLETOS EXTRAÍDOS ===');
    console.log(datos);
}

// Función para buscar y procesar el primer resultado
async function procesarResultado(datosBasicos) {
    if (!datosBasicos || !datosBasicos.url) {
        mostrarEstado('error', 'No se encontró ningún resultado');
        return;
    }
    
    try {
        const datosCompletos = await extraerContenidoCompleto(datosBasicos.url);
        mostrarResultado(datosCompletos);
    } catch (error) {
        mostrarEstado('error', error.message);
        botonActualizar.disabled = false;
    }
}

// Función para buscar resultado
async function buscarResultado() {
    botonActualizar.disabled = true;
    mostrarEstado('loading', 'Buscando primer resultado...');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('google.com/search')) {
            mostrarEstado('error', 'Por favor, ve a Google y haz una búsqueda');
            botonActualizar.disabled = false;
            return;
        }
        
        const resultados = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selectores = [
                    'div#search a[href^="http"]:not([href*="google.com"])',
                    'div.g a[href^="http"]:not([href*="google.com"])',
                    'a[jsname]:not([href*="google.com"])',
                    'h3 a[href]',
                    'a[ping]'
                ];
                
                let primerResultado = null;
                for (const selector of selectores) {
                    primerResultado = document.querySelector(selector);
                    if (primerResultado && primerResultado.href && !primerResultado.href.includes('google.com')) {
                        break;
                    }
                }
                
                if (primerResultado) {
                    let titulo = primerResultado.textContent;
                    const h3Padre = primerResultado.closest('h3') || primerResultado.querySelector('h3');
                    if (h3Padre) {
                        titulo = h3Padre.textContent;
                    }
                    
                    return {
                        url: primerResultado.href,
                        titulo: titulo || 'Sin título'
                    };
                }
                return null;
            }
        });
        
        const resultado = resultados[0]?.result;
        if (resultado) {
            await procesarResultado(resultado);
        } else {
            mostrarEstado('error', 'No se encontraron resultados');
            botonActualizar.disabled = false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarEstado('error', 'Error: ' + error.message);
        botonActualizar.disabled = false;
    }
}

// Event Listeners
botonActualizar.addEventListener('click', buscarResultado);

botonGuardar.addEventListener('click', async () => {
    if (datosActuales) {
        await guardarEnStorage(datosActuales);
    }
});

botonVerGuardados.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['paginasGuardadas']);
    const paginas = result.paginasGuardadas || [];
    console.log('=== TODAS LAS PÁGINAS GUARDADAS ===');
    console.log(paginas);
    alert(`Hay ${paginas.length} páginas guardadas.\nVer consola (F12) para detalles.`);
});

botonDescargar.addEventListener('click', () => {
    if (datosActuales) {
        descargarComoTXT(datosActuales);
    }
});

botonAnalizar.addEventListener('click', () => {
    if (datosActuales) {
        analizarDatos(datosActuales);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    buscarResultado();
    mostrarDatosGuardados();
});

