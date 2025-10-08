//Service Worker 

//Escuchar cuando se instala la extension
chrome.runtime.onInstalled.addListener(()=>{
    console.log('Extension instalada:Prueba lista')
});

//Escuchar mensajes entre diferentes partes de la extension
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    console.log('Mensaje recibido en backgroud', message)

    //En caso de ser necesario reenviar mensajes si es necesario
    if(message.action==='Primer resultado'){
        console.log('Primer resultado encontrado:', message.titulo, message.url)

    }return true;// Mantiene el canal de mensaje abierto
});

