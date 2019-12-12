/**
 * Method to clip the content of the element
 * Doesn't work with inline elements
 * 
 * @param {string} selector - a CSS selector for the element that needed to be clipped 
 * @param {number} lines - number of lines that need to left
 */
function ellipsizeTextBox(selector, lines) {
   var el = document.querySelectorAll(selector);

   if (el.length === 0) {
      console.error('There is no elements on the page with this "' + selector + '" selector. Please check the selector.');
      return
   }

   for (var i = 0; i < el.length; i++) {
      var computedStyle = window.getComputedStyle(el[i]); // Get computed styles
      var lineHeightValue = computedStyle.getPropertyValue('line-height').match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+|)/g); // Default line height in em
      var lineHeightMeasure = lineHeightValue[1]; // Find what is been used for measuring line-height
      var lineHeight = parseFloat(lineHeightValue[0]); // Parse float value of the line height
      var elHeight = (lineHeight * lines) + lineHeight; // Add one more line height so that we clip text right
      var isInline = computedStyle.getPropertyValue('display');

      if (isInline === 'inline') {
         console.error('Please, do not use ellipsizeTextBox function on inline elements it may cause an infinite loop and block your app.',
            'You have used it on <' + el[i].tagName.toLowerCase() + '> tag which was found by this "' + selector + '" selector');
         break;
      }

      el[i].style.height = elHeight + lineHeightMeasure; // Set element height according to the number of lines we want to left

      var wordArray = el[i].innerHTML.split(' ');

      while (el[i].scrollHeight > el[i].offsetHeight) {
         wordArray.pop(); // We will remove last word untill scroll height want be equal to offset height
         el[i].innerHTML = wordArray.join(' ') + '...';
      }

      el[i].removeAttribute('style'); // Remove style attribute so the height of the element will return to auto
   }
}