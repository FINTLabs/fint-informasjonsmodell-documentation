import { Pipe, PipeTransform } from '@angular/core';
import { Classification } from '../../../EA/model/Classification';

@Pipe({
    name: 'classAbstract',
    standalone: false
})
export class ClassAbstract implements PipeTransform {
  transform(array: Array<Classification>): Array<Classification> {

    let result: Classification[] = new Array();
    array.forEach(clazz => {
      if (clazz.isAbstract === "true") {
        result.push(clazz);
      }
    });
    return result;

  }
}
