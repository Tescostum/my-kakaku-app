import * as fs from 'fs'
import * as puppeteer from 'puppeteer'

class Main {
  private _allStartTime = 0
  private _startTime = 0

  async start() {
    this._allStartTime = Date.now()

    this.setStartTime()
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.showConsole('browser.launch()')

    this.setStartTime()
    const page = await browser.newPage()
    this.showConsole('browser.newPage()')

    const wordList = ['Ryzen', '2400G']
    let param = ''
    let isFirst = true
    wordList.forEach(element => {
      if (!isFirst) {
        param += '+'
      } else {
        isFirst = false
      }
      param += encodeURI(element)
    })

    const pageURL =
      'http://kakaku.com/search_results/' + param + '/?category=0001'
    console.log(pageURL)

    this.setStartTime()
    await page.goto(pageURL, { waitUntil: 'domcontentloaded' })
    this.showConsole('page.goto')

    this.setStartTime()
    const h1 = await page.$('h1 a')
    const title = await (await h1.getProperty('innerHTML')).jsonValue()
    this.showConsole('get title')

    this.setStartTime()
    const items = await page.$$('.item > .itemBg')
    const data = []
    if (items) {
      for (const item of items) {
        data.push(await this.getData(item))
      }
    }

    this.showConsole('get items')

    this.setStartTime()
    await browser.close()
    this.showConsole('browser close')

    const now = Date.now()
    console.log('全てのデータ取得終了:', now - this._allStartTime, 'ms')

    this.saveDataToJsonFile({
      title,
      list: data
    })
  }

  async getData(item: puppeteer.ElementHandle): Promise<any> {
    const data = { name: '', price: '' }

    const itemnameN = await item.$('p.itemnameN')
    if (itemnameN) {
      const nameProp = await itemnameN.getProperty('textContent')
      data.name = await nameProp.jsonValue().catch(() => '')
    }

    const priceN = await item.$('p.price > span.yen')
    if (priceN) {
      const priceProp = await priceN.getProperty('textContent')
      data.price = await priceProp.jsonValue().catch(() => '')
    }

    return data
  }

  setStartTime(): void {
    this._startTime = Date.now()
  }

  showConsole(message: String): void {
    const now = Date.now()
    console.log(message, ':', now - this._startTime, 'ms')
  }

  saveDataToJsonFile(data): void {
    fs.writeFile('kakaku.json', JSON.stringify(data, null, '  '), err => {
      if (err) {
        console.log(err)
      }
    })
  }
}

const prog = new Main()
prog.start()
