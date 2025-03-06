import { Pipe, PipeTransform } from '@angular/core';
import { Classification } from '../../../EA/model/Classification';

@Pipe({
    name: 'complexDatatype',
    standalone: false
})
export class ComplexDatatype implements PipeTransform {
  transform(array: Array<Classification>): Array<Classification> {

    const result: Classification[] = [];
    array.forEach(clazz => {
      if (clazz.extension.properties[0].stereotype === undefined) {
        result.push(clazz);
      }
    });
    return result;

  }
}
