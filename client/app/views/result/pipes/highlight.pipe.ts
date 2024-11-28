import { Pipe, PipeTransform } from '@angular/core';

import { ModelService } from 'app/EA/model.service';

@Pipe({
    name: 'highlight',
    standalone: false
})
export class HighlightPipe implements PipeTransform {

  constructor() { }

  transform(text: string, search: string): string {
    return (search && search.length && text
      ? text.replace(new RegExp(this.pattern(search), 'gi'), (match) => `<span class="highlight">${match}</span>`)
      : text);
  }

  pattern(search) {
    return search
      .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
      .split(' ')
      .filter((t) => t.length > 0)
      .join('|');
  }
}
