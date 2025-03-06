import { Pipe, PipeTransform } from '@angular/core';
import { Classification } from '../../../EA/model/Classification';

@Pipe({
    name: 'classSort',
    standalone: false
})
export class ClassSort implements PipeTransform {
  transform(array: Array<Classification>): Array<Classification> {

    const intlCollator = new Intl.Collator('nb');

    return array.sort((left: Classification, right: Classification) => {
      return intlCollator.compare(left.name, right.name);
    });
  }
}
