/**@class TimeUtil*/
function TimeUtil() {
  const SELF = {
    getDateISO: (yourDate) => {
      if (!yourDate)
        yourDate = new Date()
      const offset = yourDate.getTimezoneOffset()
      yourDate = new Date(yourDate.getTime() - (offset * 60 * 1000))
      return parseInt(yourDate.toISOString().split('T')[0].split('-').join(''), 10)
    },
    getMonthISO: (yourDate) => {
      if (!yourDate)
        yourDate = new Date()
      let dateFull = yourDate.toISOString().split('T')[0].split('-'),
        dateMonth = dateFull.splice(0, 2).join('')
      return parseInt(dateMonth, 10)
    },
    getTimeISO: (yourDate) => {
      if (!yourDate)
        yourDate = new Date()
      const offset = yourDate.getTimezoneOffset()
      yourDate = new Date(yourDate.getTime() - (offset * 60 * 1000))
      return yourDate.toISOString().split('T')[1].split('.')[0].split(':').join('')
    },
    chunkSubstr: (str, size) => {
      const numChunks = Math.ceil(str.length / size)
      const chunks = new Array(numChunks)

      for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.slice(o, size + o)
      }
      return chunks
    },
    strToDate: (dtStr) => {
      if (!dtStr) return null
      let dateParts = dtStr.split("/");
      let timeParts = dateParts[2].split(" ")[1].split(":");
      dateParts[2] = dateParts[2].split(" ")[0];
      return new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
    }
  }
  return {
    /**@memberOf TimeUtil
     * @return int hhmmss*/
    getTimeISO: () => {
      return parseInt(SELF.getTimeISO(), 10)
    },
    /**@memberOf TimeUtil
     * @return int yyyymmdd*/
    getDateISO: () => {
      return SELF.getDateISO()
    },
    /**@memberOf TimeUtil
     * @return int yyyymmdd*/
    parseDateISO: (date) => {
      return SELF.getDateISO(date)
    },
    /**@memberOf TimeUtil
     * @return int yyyymm*/
    parseMonthISO: (date) => {
      return SELF.getMonthISO(date)
    },
    /**@memberOf TimeUtil
     * @description get current date
     * @param format MMDDYYYY | DDMMYYYY | YYYYMMDD (default: MMDDYYYY)
     * @param yourDate the date which to convert
     * @return String MMDDYYYY*/
    getStrDate: (format = 'MMDDYYYY', yourDate) => {
      const now = '' + SELF.getDateISO(yourDate)
      if (format === 'MMDDYYYY')
        return now.substring(4, 6) + now.substring(6) + now.substring(0, 4)
      if (format === 'DDMMYYYY')
        return now.substring(6) + now.substring(4, 6) + now.substring(0, 4)
      if (format === 'DD/MM/YYYY')
        return `${now.substring(6)}/${now.substring(4, 6)}/${now.substring(0, 4)}`
      if (format === 'MM/YYYY')
        return `${now.substring(4, 6)}/${now.substring(0, 4)}`
      if (format === 'MMYYYY')
        return `${now.substring(4, 6)}${now.substring(0, 4)}`
      if (format === 'YYYYMMDD') {
        return `${now.substring(0, 4)}${now.substring(4, 6)}${now.substring(6)}`
      }
      if (format === 'DD-MM-YYYY')
        return `${now.substring(6)}-${now.substring(4, 6)}-${now.substring(0, 4)}`
      if (format === 'MM-DD-YYYY')
        return `${now.substring(4, 6)}-${now.substring(6)}-${now.substring(0, 4)}`
      if (format === 'YYYY-MM-DD')
        return `${now.substring(0, 4)}-${now.substring(4, 6)}-${now.substring(6)}`
      return now;
    },
    /**@memberOf TimeUtil
     * @description get current time
     * @param format  (default: SS:MM:HH)
     * @param yourDate the date which to convert
     * @return String MMDDYYYY*/
    getStrTime: (format = 'SS:MM:HH', yourDate) => {
      if (!yourDate)
        yourDate = new Date()
      let time = SELF.getTimeISO(yourDate)
      if (format === 'HHMMSS') {
        return time
      }
      if (format === 'SS:MM:HH') {
        return SELF.chunkSubstr('' + time, 2).join(':')
      }
      if (format === 'HH:MM:SS') {
        return `${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4)}`
      }
    },
    /**@memberOf TimeUtil
     * @description convert string date to date
     * @param dtStr date (21/04/2022 09:11:27)
     * @return Date*/
    strToDate: (dtStr) => {
      if (!dtStr) return null
      let dateParts = dtStr.split("/");
      let timeParts = dateParts[2].split(" ")[1].split(":");
      dateParts[2] = dateParts[2].split(" ")[0];
      // month is 0-based, that's why we need dataParts[1] - 1
      return new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
    },
    /**
     * @description: convert date to day of week
     * @param (dd/mm/yyyy)
     * @returns string; ex: THU HAI
     */
    getDayOfWeek: (date) => {
      if (!date) return null;
      const [day, month, year] = date.split('/').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const daysOfWeek = ['CHU NHAT', 'THU HAI', 'THU BA', 'THU TU', 'THU NAM', 'THU SAU', 'THU BAY'];
      const dayOfWeek = parsedDate.getDay();
      const dayName = daysOfWeek[dayOfWeek];
      return dayName;
    },
    /**
     * @description: Lay tat ca nhung ngay o giua F_DATE va T_DATE
     * @param {*} F_DATE (dd/mm/yyyy)
     * @param {*} T_DATE (dd/mm/yyyy)
     * @returns array date
     */
    getDateList: (F_DATE, T_DATE) => {
      let f_date = SELF.strToDate(F_DATE + ' 07:00:00'),
        t_date = SELF.strToDate(T_DATE + ' 07:00:00'),
        curr_date = f_date,
        date_list = []
      while (curr_date <= t_date) {
        date_list.push(new Date(curr_date))
        curr_date.setDate(curr_date.getDate() + 1);
      }
      return date_list
    },
    /**
     * @description: Đếm số ngày giữa 2 ngày F_DATE va T_DATE
     * @param {*} F_DATE Date
     * @param {*} T_DATE Date
     * @returns number
     */
    countDays: (F_DATE, T_DATE) => {
      let curr_date = F_DATE,
        count = 0
      while (curr_date < T_DATE) {
        count++
        curr_date.setDate(curr_date.getDate() + 1)
      }
      return count
    },
    /**
     * @param yyyymmdd
     * @return DD/MM/YYYY
     */
    getStrDateFromIntDate: (intDate) => {
      let dateStr = intDate.toString()
      return `${dateStr.slice(6)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}`
    },
    /**
     * @param: DD/MM/YYYY
     * @return yyyymmdd
     */
    getIntDateFromStrDate: (date) => {
      const dateArr = date.split('/')
      return `${dateArr[2]}${dateArr[1]}${dateArr[0]}`
    },
    /**
     * @param {*} dateStr  DD/MM/YYYY
     * @returns Date
     */
    convertStrToDate: (dateStr) => {
      return SELF.strToDate(dateStr + ' 07:00:00')
    },
    /**
     * @param: yyyymmdd
     * @return yyyymmdd - 1 day
     */
    getPrevDate: (intDate) => {
      let dateStr = intDate.toString()
      const dateString = `${dateStr.slice(6)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}`
      const dateD = SELF.strToDate(dateString + ' 07:00:00')
      const prevData = dateD.setDate(dateD.getDate() - 1)
      const now = '' + SELF.getDateISO(new Date(prevData))
      const prevDataStr = `${now.substring(6)}/${now.substring(4, 6)}/${now.substring(0, 4)}`
      const prevDataArr = prevDataStr.split('/')
      return `${prevDataArr[2]}${prevDataArr[1]}${prevDataArr[0]}`
    },
    /**
    * @param: dd/mm/yyyy
    * @return dd/mm/yyyy
    */
    getLastDayOfMonth: (dateString) => {
      const [day, month, year] = dateString.split('/').map(Number);
      const nextMonth = new Date(year, month, 0);
      const lastDay = nextMonth.getDate();
      return `${lastDay}/${month.toString().padStart(2, '0')}/${year}`;
    },
    getNextMonth: (dateString) => {
      // Split the date string into day, month, and year
      const [day, month, year] = dateString.split('/').map(Number);

      // Create a Date object for the first day of the next month
      const nextMonth = new Date(year, month, 1);

      // Extract the day, month, and year from the Date object
      const nextMonthDay = nextMonth.getDate();
      const nextMonthMonth = nextMonth.getMonth() + 1; // JavaScript months are zero-based
      const nextMonthYear = nextMonth.getFullYear();

      // Format the date as dd/mm/yyyy
      const formattedNextMonth = `${String(nextMonthDay).padStart(2, '0')}/${String(nextMonthMonth).padStart(2, '0')}/${nextMonthYear}`;

      return formattedNextMonth;
    },
    getNextDate: (dateString) => {
      // Phân tích chuỗi ngày để lấy ngày, tháng và năm
      const [day, month, year] = dateString.split('/').map(Number);

      // Tạo đối tượng Date từ các giá trị phân tích
      const date = new Date(year, month - 1, day);

      // Tăng ngày lên một ngày
      date.setDate(date.getDate() + 1);

      // Lấy ngày, tháng và năm từ đối tượng Date mới
      const nextDay = String(date.getDate()).padStart(2, '0');
      const nextMonth = String(date.getMonth() + 1).padStart(2, '0'); // Tháng trong JS bắt đầu từ 0
      const nextYear = date.getFullYear();

      // Định dạng lại ngày thành chuỗi dd/mm/yyyy
      return `${nextDay}/${nextMonth}/${nextYear}`;
    },

    compareDates: (dateStr1, dateStr2) => {
      // Parse the first date string
      const [day1, month1, year1] = dateStr1.split('/').map(Number);
      const date1 = new Date(year1, month1 - 1, day1);

      // Parse the second date string
      const [day2, month2, year2] = dateStr2.split('/').map(Number);
      const date2 = new Date(year2, month2 - 1, day2);

      // Compare the two dates
      if (date1 > date2) {
        return 1; // dateStr1 is later than dateStr2
      } else if (date1 < date2) {
        return -1; // dateStr1 is earlier than dateStr2
      } else {
        return 0; // dateStr1 is the same as dateStr2
      }
    }

  }
}
module.exports = new TimeUtil()
