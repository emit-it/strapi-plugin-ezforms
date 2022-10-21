'use strict'

module.exports = ({ strapi }) => ({
  async index(ctx) {
    let verification = {}
    let formName = strapi.config.get('plugin.ezforms.enableFormName') ? ctx.request.body.formName : 'form'
    // Checks if there is a captcha provider
    if (!(strapi.config.get('plugin.ezforms.captchaProvider.name') === 'none') && (strapi.config.get('plugin.ezforms.captchaProvider.name'))) {
      verification = await strapi.plugin('ezforms').service(strapi.config.get('plugin.ezforms.captchaProvider.name')).validate(ctx.request.body.token)

      //throws error if invalid
      if (!verification.valid) {
        strapi.log.error(verification.error)
        if (verification.error.code === 500) {
          return ctx.badRequest("ReCAPTCHA verification has failed: " + verification.error.message)
        } else if (verification.error.code === 400) {
          return ctx.badRequest(verification.error.message)
        } else {
          return ctx.internalServerError("Internal server error")
        }
      }
    }

    //sends notifications
    for (const provider of strapi.config.get('plugin.ezforms.notificationProviders')) {
      if (provider.enabled) {
        try {
          await strapi.plugin('ezforms').service(provider.name).send(provider.config, formName, ctx.request.body.formData)
        } catch (e) {
          strapi.log.error(e)
          return ctx.internalServerError('An unexpected error has occurred');
        }
      }
    }

    // Adds to DB
    let parsedScore = verification.score || -1
    try {
      await strapi.query('plugin::ezforms.submission').create({
        data: {
          score: parsedScore,
          formName: formName,
          data: ctx.request.body.formData,
        }
      }
      )
    } catch (e) {
      strapi.log.error(e)
      return ctx.internalServerError('A Whoopsie Happened')
    }

    return ctx.body = ctx.request.body.formData
  },
})

