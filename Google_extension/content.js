console.log("Extension funcionando"); 

function obtenerPrimerResultado(){

    const elementos=document.querySelectorAll('h3 a[href]');    
    
    const elemento_delimitado=Array.from(elementos)
        .slice(0,50)
        .filter(elemento=>elemento.href.includes('https'))
        .map((elemento, indice)=>{
            const snippet=elemento.closest('.g')?.querySelector('.VwiC3b')||
                            elemento.closest('.g').querySelector('.s')||
                            '';
        return{
            posicion:indice+1,
            titulo:elemento.textContent,
            url:elemento.href,
            snippet:snippet.textContent || 'descripcion vacia'};})
            

        
    if(elemento_delimitado){

        console.log("Resultados encontrados")

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


