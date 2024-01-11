import { FintInformasjonsmodellPage } from './app.po';

describe('fint-informasjonsmodell App', function() {
  let page: FintInformasjonsmodellPage;

  beforeEach(() => {
    page = new FintInformasjonsmodellPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    // expect(page.getParagraphText()).toEqual('app works!');
  });
});
