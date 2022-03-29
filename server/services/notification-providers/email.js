'use strict';
module.exports = ({strapi}) => ({
  async send(config, data){
    let recipients = await strapi.query('plugin::ezforms.recipient').findMany();
    let message = ""
    function transformData(key, data) {
      switch (key) {
        case 'email':
          return `<a href="mailto:${data}" target="_blank">${data}</a>`;
        default:
          return data;
      }
    }
    //Loop through data and construct message from data object
    for(let key in data){
      message += `<strong>${key}</strong>: ${transformData(key, data[key])}<br />`
    }
    //loop through the recipients and send an email
    for(let recipient of recipients){
      try{
        await strapi.plugins['email'].services.email.send({
          to: recipient.email,
          from: config.from,
          subject: 'Formulier op website: nieuwe inzending',
          text: message,
        });
      } catch (e) {
        strapi.log.error(e)
      }
    }

  }


});
