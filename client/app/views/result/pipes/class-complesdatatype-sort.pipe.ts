import { Pipe, PipeTransform } from '@angular/core';
import { Classification } from '../../../EA/model/Classification';

@Pipe({name: 'complexDatatype'})
export class ComplexDatatype implements PipeTransform {
  transform(array: Array<Classification>): Array<Classification> {

    let result: Classification[] = new Array();
    array.forEach(clazz => {
      console.log(clazz.extension.properties[0].stereotype);
      if (clazz.extension.properties[0].stereotype === undefined) {
        result.push(clazz);
      }
    });
    return result;

  }
}
