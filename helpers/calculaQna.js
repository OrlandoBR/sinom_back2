function calculaQuincena() {

    const today = new Date();
    const year = today.getFullYear();

    // Establecer la fecha inicial de la primera quincena del año
    const firstQuincenaStart = new Date(year, 0, 1);
    const fifteenDaysInMilliseconds = 15 * 24 * 60 * 60 * 1000;

    // Calcular la diferencia entre la fecha actual y la fecha inicial
    const timeDifference = today - firstQuincenaStart;
    const currentQuincena = Math.ceil(timeDifference / fifteenDaysInMilliseconds);

    return currentQuincena;
}

// Función para validar el texto
function isValidDateText(text,sesgo=0) {
  // Verificar que el texto tenga una longitud de 6 caracteres
  if (text.length !== 6) {
    return false;
  }

  if(text!=='999999'){
      // Obtener el año actual y la quincena actual
      const year = new Date().getFullYear();
      const currentQuincena = calculaQuincena();

      // Obtener los dígitos para el año y la quincena del texto
      const textYear = parseInt(text.substr(0, 4), 10);
      const textQuincena = parseInt(text.substr(4, 2), 10);

      // Validar que el año sea igual al año actual
      if (textYear !== year) {
      return false;
      }

      // Validar que la quincena no sea menor que la quincena actual
      if (textQuincena < currentQuincena-sesgo) {
      return false;
      }

      // Validar que la quincena no sea mayor que 2 quincenas
      //if (textQuincena > currentQuincena + 1) {
      // return false;
      // }
  }

  return true;
}

// Función para validar el texto
function isValidDateText_noMenor_noMayor(text,sesgo=0) {
  // Verificar que el texto tenga una longitud de 6 caracteres
  if (text.length !== 6) {
    return false;
  }

  if(text!=='999999'){
      // Obtener el año actual y la quincena actual
      const year = new Date().getFullYear();
      const currentQuincena = calculaQuincena();

      // Obtener los dígitos para el año y la quincena del texto
      const textYear = parseInt(text.substr(0, 4), 10);
      const textQuincena = parseInt(text.substr(4, 2), 10);

      // Validar que el año sea igual al año actual
      if (textYear !== year) {
      return false;
      }

      // Validar que la quincena no sea menor que la quincena actual
      if (textQuincena < currentQuincena-sesgo) {
      return false;
      }

      //Validar que la quincena no sea mayor que 2 quincenas
      if (textQuincena > currentQuincena + 1) {
       return false;
       }
  }

  return true;
}

module.exports = { 
calculaQuincena,
isValidDateText,
isValidDateText_noMenor_noMayor
};