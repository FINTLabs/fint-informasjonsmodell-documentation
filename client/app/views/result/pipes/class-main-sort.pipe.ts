import { Pipe, PipeTransform } from '@angular/core';
import { Classification } from '../../../EA/model/Classification';

@Pipe({
    name: 'classMain',
    standalone: false
})
export class ClassMain implements PipeTransform {
  transform(array: Array<Classification>): Array<Classification> {

    const result: Classification[] = [];
    array.forEach(clazz => {
      if (clazz.extension.properties[0].stereotype === "hovedklasse") {
        result.push(clazz);
      }
    });
    return result;

  }
}
