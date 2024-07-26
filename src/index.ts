import go from './CreateApp'
import dotenv from 'dotenv'

const parsed = dotenv.configDotenv()
console.clear()
console.log(new Date(), 'Starting App ===::')
go()