import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'expandable',
    standalone: false
})
export class ExpandablePipe implements PipeTransform {

  transform(value: any, args?: string): any {
    if (value && value.length > 0) {
      const firstLine = this.stripHtml(value.substr(0, value.indexOf('\n')));
      const theRest = value.substr(value.indexOf('\n') + 1);
      if ((!args || args == 'both') && theRest && theRest.length > 0) {
        return `<details><summary>${firstLine}</summary>${theRest}</details>`;
      } else if (args == 'last') {
        return theRest;
      }
      return firstLine;
    }
    return value;
  }

  stripHtml(text: string) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }
}
