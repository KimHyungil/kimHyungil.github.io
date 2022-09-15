self.addEventListener('push', function (event) {
    const data = JSON.parse(event.data.text());
    
    event.waitUntil( async function() {
        for (const client of await self.clients.matchAll({includeUncontrolled: true})) {
            client.postMessage(data);
        }

        self.registration.showNotification( data.title, {
            body: data.message
        })
    }());

});