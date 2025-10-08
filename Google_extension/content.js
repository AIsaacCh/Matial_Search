console.log("Extension funcionando"); 

function obtenerPrimerResultado(){

    const primerResultado=document.querySelector('h3 a[href]');

    if(primerResultado){
        const url=primerResultado.href;
        const titulo=primerResultado.textContent;

        console.log("Primer resultado encontrado", url, titulo)

        chrome.runtime.sendMessage({
            action:'primer_resultado',
            url:url,
            titulo:titulo
        });

        mostrar(primerResultado, titulo)
    } else{
        console.log("No funciono")
    }
}

function mostrar(elemento,titulo){
    
    const badge=document.createElement('span');
    badge.innerHTML=':D';
    badge.title='Resultado leido';
    badge.style.color='#4285f4'
    badge.style.fontSize='12px'
    elemento.appendChild(badge)

}

function inicializar(){
    setTimeout(()=>{
        obtenerPrimerResultado();
    },1000);
}

if(document.readyState=='loading'){
    document.addEventListener('DOMContentLoaded',inicializar);
}else{
    inicializar()
}


let ultimaUrl=location.href;
new MutationObserver(()=>{
    const urlActual=location.href;
    if(urlActual!==ultimaUrl){
        ultimaUrl=urlActual;
        inicializar();
    }

}).observe(document,{subtree:true, childList:true});


