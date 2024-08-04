'use strict'
const Tracking = require('./../../models/tracking').Tracking
/** @class TrackingController
 **/
function TrackingController() {
  const SELF = {
    IGNORE_URL: ['']
  };
  return {
    /**@memberOf TrackingController
     *
     * @param req
     * @param res
     * @param next
     */
    trackAccessUrl: (req, res, next) => {
      if(SELF.IGNORE_URL.indexOf(req.url) > -1) return next();
      if(req.user){
        Tracking.create({user: req.user.email, url: req.url, method: req.method, ip: req.ip}).catch(e => {console.log('trackAccessUrl', e)});
      }
      else
        if(req.url === '/user/login')
          Tracking.create({url: req.url, user: req.body.email, method: req.method, ip: req.ip, userAgent: req.headers['user-agent']}).catch(e => {console.log('trackAccessUrl', e)});
        else
          Tracking.create({url: req.url, method: req.method, ip: req.ip}).catch(e => {console.log('trackAccessUrl', e)});
      next()
    }
  }
}

module.exports = new TrackingController()