
/**@class Util*/
function Util() {
  return {
    /**@memberOf Util*/
    numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    /**@memberOf Util*/
    getCurrentDate: (format) => {
      let today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1; //January is 0!

      let yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      if(format === 'dd/mm/yyyy')
        return `${dd}/${mm}/${yyyy}`
      return `${yyyy}${mm}${dd}`
    }
  }
}

module.exports = new Util()