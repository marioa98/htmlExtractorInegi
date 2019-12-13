const fs = require('fs');
const mysql = require('mysql');
const pptr = require('puppeteer');
const request = require('request')
const keys = require('./config/keys')

async function index() {
    const connection = mysql.createConnection(keys);
    const query = "SELECT idPublicaciones, urlFuente, proveedor from altmetrics_temporal WHERE proveedor != 'null';"

    await connection.query(query, function (err, result, field) {
        if (err) {
            console.log("Hubo un error al momento de establecer la conexión en la base de datos.");
            console.log(err)
        } else {
            let all_urls = {};

            result.forEach((element, index) => {
                const e = {
                    'idPublicaciones': element.idPublicaciones,
                    'urlFuente': element.urlFuente,
                    'proveedor': element.proveedor
                }

                all_urls[index] = e;
            });

            extractInnerHtml(all_urls)
        }
    })

    await connection.end(function (err) {
        if (err) console.log(`Algo salió mal al tratar de cerrar conexión con la base de datos, favor de revisar: \n ${err}`); //En caso de errores al momento de finalizar la conexión a la base de datos, se lanza este mensaje
        else console.log("Conexión cerrada de manera exitosa");
    })

}

async function extractInnerHtml(all_urls) {

    for (let element in all_urls) {

        let url = all_urls[element].urlFuente;
        let id = all_urls[element].idPublicaciones;

        let data

        try {

            const browser = await pptr.launch();
            const page = await browser.newPage();

            await page.goto(url);
            
            data = await page.content();


            await browser.close();


        } catch (e) {
            console.log(`No se pudo obtener respuesta del servidor: ${url}`)
            console.log(`Surgio un error en: ${e}`)
        }

        saveInnerHTML(data, id)
        await skipBan(5000);
    }
}

function saveInnerHTML(data, idPublicacion) {

    let dir = `${__dirname}/HTML_PlumX`;

    fs.readdir(dir, err => {
        if (err) {
            fs.mkdir(dir, (err) => {
                if (err) console.log(err);
                else {
                    fs.writeFile(`${dir}/${idPublicacion}.html`, data, (err) => {
                        if (err) console.log(`Error al momento de guardar el html del ${idPublicacion}`);
                        else console.log(`Guarado archivo ${idPublicacion}.html\n------------------------------------------------------------`)
                    })
                }
            })
        }else{
            fs.writeFile(`${dir}/${idPublicacion}.html`, data, (err) => {
                if (err) console.log(`Error al momento de guardar el html del ${idPublicacion}`);
                else console.log(`Guarado archivo ${idPublicacion}.html\n------------------------------------------------------------`)
            })
        }
    })
}

function skipBan(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    })
}

index();