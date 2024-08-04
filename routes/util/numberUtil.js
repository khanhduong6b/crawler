const { valid, number } = require("joi");

const defaultNumbers =' hai ba bốn năm sáu bảy tám chín'
const chuHangDonVi = ('1 một' + defaultNumbers).split(' ')
const chuHangChuc = ('lẻ mười' + defaultNumbers).split(' ')
const chuHangTram = ('không một' + defaultNumbers).split(' ')
const dvBlock = '1 nghìn triệu tỷ'.split(' ')

/**@class numberUtil*/
function numberUtil(){
    const SELF = {
      isNumber: (value) => {
          if(typeof(value)==="number")
              return true
          else{
              value = value.replace(/,/g, '')
              value = parseFloat(value)
          }

          if((value ^ 0) !== value)
              return true

          if(Number.isInteger(value))
              return true
          return false
      },
      convert_block_three: (number) => {
        if(number == '000') return '';
        const _a = number + ''; //Convert biến 'number' thành kiểu string
        //Kiểm tra độ dài của khối
        switch (_a.length) {
          case 0: return '';
          case 1: return chuHangDonVi[_a];
          case 2: return SELF.convert_block_two(_a);
          case 3:
            let chuc_dv = '';
            if (_a.slice(1,3) != '00') {
              chuc_dv = SELF.convert_block_two(_a.slice(1,3));
            }
            let tram = chuHangTram[_a[0]] + ' trăm';
            return tram + ' ' + chuc_dv;
        }
      },
      convert_block_two: (number) => {
        let dv = chuHangDonVi[number[1]];
        let chuc = chuHangChuc[number[0]];
        let append = '';
        // Nếu chữ số hàng đơn vị là 5
        if (number[0] > 0 && number[1] == 5) {
          dv = 'lăm'
        }
        // Nếu số hàng chục lớn hơn 1
        if (number[0] > 1) {
          append = ' mươi';
          if (number[1] == 1) {
            dv = ' mốt';
          }
        }
        return chuc + '' + append + ' ' + dv;
      },
      to_vietnamese(number) {
        const str = parseInt(number) + '';
        let index = str.length;
        let i = 0;
        let arr = [];
        let result = [];
        let rsString = '';
        if (index == 0 || str == 'NaN') {
          return '';
        }
        // Chia chuỗi số thành một mảng từng khối có 3 chữ số
        while (index >= 0) {
          arr.push(str.substring(index, Math.max(index - 3, 0)));
          index -= 3;
        }
        // Lặp từng khối trong mảng trên và convert từng khối đấy ra chữ Việt Nam
        for (i = arr.length - 1; i >= 0; i--) {
          if (arr[i] != '' && arr[i] != '000') {
            result.push(SELF.convert_block_three(arr[i]));

            // Thêm đuôi của mỗi khối
            if (dvBlock[i]) {
              result.push(dvBlock[i]);
            }
          }
        }
        // Join mảng kết quả lại thành chuỗi string
        rsString = result.join(' ');
        // Trả về kết quả kèm xóa những ký tự thừa
        return rsString.replace(/[0-9]/g, '').replace(/ /g,' ').replace(/ $/,'');
      },
    }
    return {
      numberWithCommas: (x) => {
        let parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".")
      },
      roundNumber: (x,y) => {
        if(!y)  y = 0
        if(SELF.isNumber(x))
            return (x).toFixed(y)
        else return 0
      },
      convertViToEn: (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      },
      convertNumToStringVND: (num) => {
        return SELF.to_vietnamese(num)
      },
    }
  }
  module.exports = new numberUtil()
