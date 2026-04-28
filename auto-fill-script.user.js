// ==UserScript==
// @name         HH Auto-Fill - All-in-One
// @namespace    tampermonkey.net/
// @version      3.3.3
// @description  Rellena y envía automáticamente el survey HH_SIM_Test con un solo clic
// @author       HubRescue Team
// @match        https://pulse.aws/survey/KERWN7PR*
// @updateURL    https://raw.githubusercontent.com/ESHubDelivery/HubHeroes/main/auto-fill-script.user.js
// @downloadURL  https://raw.githubusercontent.com/ESHubDelivery/HubHeroes/main/auto-fill-script.user.js
// @homepageURL  https://github.com/ESHubDelivery/HubHeroes
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

   function checkSuccess() {
        // Buscamos palabras clave en lugar de la frase entera (evita fallos por tildes o comillas)
        const bodyText = document.body.textContent;
        const hasGracias = bodyText.includes('Gracias') || bodyText.includes('Thank you');
        const hasRegistrado = bodyText.includes('registrado') || bodyText.includes('recorded');

        if (hasGracias && hasRegistrado) {
            console.log("✅ Pipeline completo detectado. Cerrando pestaña...");
            // Cambiamos el mensaje del panel si existe
            const status = document.getElementById('statusMessage');
            if (status) status.textContent = "🚀 ¡Hecho! Cerrando...";

            setTimeout(() => { window.close(); }, 1500);
            return true;
        }
        return false;
    }

    // Ejecutamos al cargar y también un par de veces después por si es lento
    if (checkSuccess()) return;
    const successRetry = setInterval(() => {
        if (checkSuccess()) clearInterval(successRetry);
    }, 1000);
    const fieldIDs = {
        login: 'responses.cee8f366-d875-464e-8059-fb3f8dc38bc1.responseVal',
        store: 'responses.9c2379ec-8160-4d07-9ede-d71cfc7f1ec3.responseVal',
        storevol: 'responses.6999423f-d1d0-4d53-b384-1ae8d241e98c.responseVal',
        packagesdrop: 'responses.a480f5e1-4cf0-4f76-b7e4-33ee6b42ccf5.responseVal',
        hubheros: 'responses.66c37203-eadd-4ab8-b85c-75ff2a9313c0.responseVal',
        packagessaved: 'responses.05b6d15a-1832-40ff-87e4-a65260386504.responseVal',
        reason: 'responses.007d77fa-d7a0-40d9-9300-2d6a482c6ce8.responseVal',
        station: 'responses.78b2467c-b230-45ff-a70a-fa64336d2a2f.responseVal',
        openticket: 'responses.befbc3b8-0330-4b0c-a981-9e1a72a697d2.responseVal',
        rejectedhubs: 'responses.fc0a4355-3828-43d7-9267-3b1b55376be5.responseVal',
        unresponsivehub: 'responses.bdec1442-5efa-486b-bf75-53eef1eb5f01.responseVal'
    };

    const panel = document.createElement('div');
    panel.style.cssText = `position:fixed;bottom:20px;left:20px;width:300px;background:white;border:2px solid #FF9900;border-radius:8px;padding:15px;box-shadow:0 10px 20px rgba(0,0,0,0.2);z-index:10000;font-family:Arial,sans-serif;`;
    panel.innerHTML = `
        <h3 style="margin:0 0 10px 0; color:#232F3E; font-size:16px;">🤖 HH Auto-Fill</h3>
        <div id="statusMessage" style="font-size:12px; color: #ef4444; font-weight: bold;">🔍 Buscando campos en la página...</div>
        <button id="autoSubmitButton" style="width:100%; margin-top:10px; padding:10px; background:#FF9900; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">🚀 RELLENAR MANUAL</button>
    `;
    document.body.appendChild(panel);

    function forceValue(el, value) {
        if (!el) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function autoFill() {
        const urlParams = new URLSearchParams(window.location.search);
        const storeField = document.querySelector(`textarea[name="${fieldIDs.store}"]`);

        if (!storeField) return false;

        // 👇 CALCULADORA DINÁMICA DE CAMPOS ESPERADOS 👇
        let expectedCount = 9; // Los 9 campos base de siempre
        if (urlParams.has('rejectedhubs')) expectedCount++;
        if (urlParams.has('unresponsivehub')) expectedCount++;

        let count = 0;
        Object.keys(fieldIDs).forEach(key => {
            const el = document.querySelector(`textarea[name="${fieldIDs[key]}"]`);
            if (el && urlParams.has(key)) {
                let val = urlParams.get(key);
                
                // LÓGICA SELECTIVA:
                if (key === 'reason') {
                    val = val.replace(/_/g, ' ');
                }
                
                forceValue(el, val);
                count++;
            }
        });

        // Actualizamos el mensaje para que veas el progreso real (ej: "10/10 campos inyectados")
        document.getElementById('statusMessage').textContent = `✅ ${count}/${expectedCount} campos inyectados.`;
        document.getElementById('statusMessage').style.color = '#10b981';

        // 👇 USAMOS LA VARIABLE EN LUGAR DEL 9 FIJO 👇
        if (count >= expectedCount) {
            setTimeout(() => {
                const submitBtn = Array.from(document.querySelectorAll('span')).find(
                    s => s.textContent.trim() === 'Registrar Drop'
                );
                if (submitBtn && submitBtn.closest('button')) {
                    submitBtn.closest('button').click();
                }
            }, 1000);
        }
        return count >= expectedCount;
    }
    // --- LÓGICA DE REINTENTO (POLLING) ---
    let attempts = 0;
    const maxAttempts = 20; // Reintenta durante 10 segundos (20 * 500ms)

    const checkInterval = setInterval(() => {
        attempts++;
        const success = autoFill();

        if (success || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (!success) {
                document.getElementById('statusMessage').textContent = "⚠️ Tiempo de espera agotado. Cierra la página y vuelve a pulsar el botón en la página de Hub Rescue.";
            }
        }
    }, 500);

    document.getElementById('autoSubmitButton').addEventListener('click', autoFill);
})();
