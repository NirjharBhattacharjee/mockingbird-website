import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { divePose, flapFrame, turnBird } from './bird.ts'

describe('divePose', () => {
  it('starts on the perch, wings up, level', () => {
    let pose = divePose(0)
    assert.equal(pose.wings, 0)
    assert.equal(pose.pitch, 0)
    assert.equal(pose.travel, 0)
    assert.equal(pose.visible, true)
  })

  it('folds, tips and drops, then is gone into the next section', () => {
    let mid = divePose(0.4)
    assert.equal(mid.wings, 110)
    assert.ok(mid.pitch > 20 && mid.pitch <= 55)
    assert.ok(mid.travel > 0 && mid.travel < 1)
    assert.equal(divePose(0.6).travel, 1)
    assert.equal(divePose(0.7).visible, false)
  })

  it('is a function of progress alone, so scrolling back reverses it', () => {
    assert.deepEqual(divePose(0.33), divePose(0.33))
  })
})

describe('bird frames', () => {
  let cells = [
    { x: 21, y: 15, role: 'a' },
    { x: 18, y: 10, role: 'a' },
    { x: 19, y: 10, role: 'a' },
    { x: 19, y: 11, role: 'a' },
    { x: 30, y: 30, role: 'b' },
  ]

  it('leaves the body where it is when the wings turn', () => {
    assert.ok(flapFrame(cells, 72).some((c) => c.x === 30 && c.y === 30 && !c.wing))
  })

  it('turning by zero changes nothing', () => {
    assert.equal(turnBird(cells, 0), cells)
  })
})
