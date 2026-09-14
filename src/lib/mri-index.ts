export type MriCard = {
  id: string;
  title: string;
  look: string;
  url: string;
  tags: string;
};
export type MriChapter = { id: string; title: string; when: string; cards: MriCard[] };

export const MRI_CHAPTERS: MriChapter[] = [
  {
    id: "climb",
    title: "Before you climb",
    when: "Ladder, weather, and whether you can walk it.",
    cards: [
      { id: "mri-ppe-51", title: "Fall protection", look: "Harness, shoes, weather, pitch. If you can’t walk it safely, binoculars and the attic still count.", url: "https://www.nachi.org/mri-ppe-51.htm", tags: "ppe safety harness fall" },
      { id: "mri-resp-protection-52", title: "Respiratory Protection", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/mri-resp-protection-52.htm", tags: "climb respiratory protection" },
      { id: "mri-pests-53", title: "Pests", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/mri-pests-53.htm", tags: "climb pests" },
      { id: "mri-photography-54", title: "Photo order", look: "Street, all four slopes, close-ups of damage, soft metals, attic. Date-stamped. Same shots every house.", url: "https://www.nachi.org/mri-photography-54.htm", tags: "photos camera documentation" },
      { id: "accessing-roof-part1-46", title: "Getting on the roof", look: "Ladder placement, brittle tiles, steep slope, two-story. Don’t step where the deck is soft.", url: "https://www.nachi.org/accessing-roof-part1-46.htm", tags: "ladder access steep walk" },
      { id: "accessing-roof-part2-47", title: "Accessing the Roof, Part 2", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/accessing-roof-part2-47.htm", tags: "climb accessing the roof, part 2" },
      { id: "accessing-roof-part3-48", title: "Accessing the Roof, Part 3", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/accessing-roof-part3-48.htm", tags: "climb accessing the roof, part 3" },
      { id: "accessing-roof-part4-49", title: "Accessing the Roof, Part 4", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/accessing-roof-part4-49.htm", tags: "climb accessing the roof, part 4" },
      { id: "accessing-roof-part5-50", title: "Accessing the Roof, Part 5", look: "Ladder, weather, PPE, pests, photos. If you can’t walk it, binoculars and the attic still count.", url: "https://www.nachi.org/accessing-roof-part5-50.htm", tags: "climb accessing the roof, part 5" },
    ],
  },
  {
    id: "style",
    title: "Roof style & framing",
    when: "Name it before you sell the squares.",
    cards: [
      { id: "roof-framing-part1-2", title: "Roof Framing, Part 1", look: "Name the roof (gable, hip, mansard) and how it’s framed before you talk squares.", url: "https://www.nachi.org/roof-framing-part1-2.htm", tags: "style roof framing, part 1" },
      { id: "roof-framing-part2-3", title: "Roof Framing, Part 2", look: "Name the roof (gable, hip, mansard) and how it’s framed before you talk squares.", url: "https://www.nachi.org/roof-framing-part2-3.htm", tags: "style roof framing, part 2" },
      { id: "roof-framing-part3-4", title: "Roof Framing, Part 3", look: "Name the roof (gable, hip, mansard) and how it’s framed before you talk squares.", url: "https://www.nachi.org/roof-framing-part3-4.htm", tags: "style roof framing, part 3" },
      { id: "roof-styles-1", title: "Roof style", look: "Gable, hip, gambrel, mansard. You already snap this for waste. Name it on the porch.", url: "https://www.nachi.org/roof-styles-1.htm", tags: "gable hip mansard framing style" },
    ],
  },
  {
    id: "hail",
    title: "Hail",
    when: "How to tell functional damage from a scuff.",
    cards: [
      { id: "hail-damage-part1-28", title: "What a hit looks like", look: "Round, random, on the weather side. Soft copper, AC fins, and plastic vents are witnesses. Linear marks and foot traffic are not hail.", url: "https://www.nachi.org/hail-damage-part1-28.htm", tags: "hail impact collateral copper ac fins" },
      { id: "hail-damage-part2-29", title: "Is it functional?", look: "A bruise that breaks the mat or asphalt is a leak path. Granule scuff with no fracture is often cosmetic. Don’t sell the scuff as a hole.", url: "https://www.nachi.org/hail-damage-part2-29.htm", tags: "hail functional cosmetic bruise" },
      { id: "hail-damage-part3-30", title: "Hail Damage, Part 3", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part3-30.htm", tags: "hail hail damage, part 3" },
      { id: "hail-damage-part4-31", title: "Hail Damage, Part 4", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part4-31.htm", tags: "hail hail damage, part 4" },
      { id: "hail-damage-part5-32", title: "Storm came from one side", look: "Hits cluster on the windward slope. Leeward looks newer. That’s directionality, not two roofs.", url: "https://www.nachi.org/hail-damage-part5-32.htm", tags: "hail direction slope windward" },
      { id: "hail-damage-part6-33", title: "Hail Damage, Part 6", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part6-33.htm", tags: "hail hail damage, part 6" },
      { id: "hail-damage-part7-34", title: "Hail Damage, Part 7", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part7-34.htm", tags: "hail hail damage, part 7" },
      { id: "hail-damage-part8-35", title: "Hail Damage, Part 8", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part8-35.htm", tags: "hail hail damage, part 8" },
      { id: "hail-damage-part9-36", title: "Hail Damage, Part 9", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part9-36.htm", tags: "hail hail damage, part 9" },
      { id: "hail-damage-part10-37", title: "Hail Damage, Part 10", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part10-37.htm", tags: "hail hail damage, part 10" },
      { id: "hail-damage-part11-38", title: "Hail Damage, Part 11", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part11-38.htm", tags: "hail hail damage, part 11" },
      { id: "hail-damage-part12-39", title: "Hail Damage, Part 12", look: "Functional vs cosmetic. Round, random, windward. Witnesses on soft metal and AC fins.", url: "https://www.nachi.org/hail-damage-part12-39.htm", tags: "hail hail damage, part 12" },
    ],
  },
  {
    id: "wind",
    title: "Wind",
    when: "Creased tabs, missing tabs, and failed seal strips.",
    cards: [
      { id: "wind-damage-part1-40", title: "Blow-off vs a crease", look: "Lifted tabs that won’t reseal, creased corners, missing pieces on edges and ridges. Pattern follows the wind, not random circles.", url: "https://www.nachi.org/wind-damage-part1-40.htm", tags: "wind blow-off crease tab adhesive" },
      { id: "wind-damage-part2-41", title: "Wind Damage, Part 2", look: "Creased tabs, missing tabs, failed seal strips. Pattern follows the wind.", url: "https://www.nachi.org/wind-damage-part2-41.htm", tags: "wind wind damage, part 2" },
      { id: "wind-damage-part3-42", title: "Wind Damage, Part 3", look: "Creased tabs, missing tabs, failed seal strips. Pattern follows the wind.", url: "https://www.nachi.org/wind-damage-part3-42.htm", tags: "wind wind damage, part 3" },
      { id: "wind-damage-part4-43", title: "Wind Damage, Part 4", look: "Creased tabs, missing tabs, failed seal strips. Pattern follows the wind.", url: "https://www.nachi.org/wind-damage-part4-43.htm", tags: "wind wind damage, part 4" },
      { id: "wind-damage-part5-44", title: "Wind Damage, Part 5", look: "Creased tabs, missing tabs, failed seal strips. Pattern follows the wind.", url: "https://www.nachi.org/wind-damage-part5-44.htm", tags: "wind wind damage, part 5" },
      { id: "wind-damage-part6-45", title: "Wind Damage, Part 6", look: "Creased tabs, missing tabs, failed seal strips. Pattern follows the wind.", url: "https://www.nachi.org/wind-damage-part6-45.htm", tags: "wind wind damage, part 6" },
    ],
  },
  {
    id: "asphalt",
    title: "Asphalt walk",
    when: "Age, layers, nails, and wear on composition shingles.",
    cards: [
      { id: "asphalt-comp-shingles-part1-55", title: "What is actually on here?", look: "3-tab vs laminate vs organic. Duration is a laminate. Organic is darker, heavier, older. That changes the story.", url: "https://www.nachi.org/asphalt-comp-shingles-part1-55.htm", tags: "asphalt duration laminate 3-tab organic" },
      { id: "asphalt-composition-shingles-part2-56", title: "Asphalt Composition Shingles, Part 2", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-composition-shingles-part2-56.htm", tags: "asphalt asphalt composition shingles, part 2" },
      { id: "asphalt-comp-shingles-part3-57", title: "Asphalt Composition Shingles, Part 3", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part3-57.htm", tags: "asphalt asphalt composition shingles, part 3" },
      { id: "asphalt-comp-shingle-part4-58", title: "Asphalt Composition Shingles, Part 4", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingle-part4-58.htm", tags: "asphalt asphalt composition shingles, part 4" },
      { id: "asphalt-comp-shingles-part5-59", title: "Asphalt Composition Shingles, Part 5", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part5-59.htm", tags: "asphalt asphalt composition shingles, part 5" },
      { id: "asphalt-comp-shingles-part6-60", title: "Asphalt Composition Shingles, Part 6", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part6-60.htm", tags: "asphalt asphalt composition shingles, part 6" },
      { id: "asphalt-comp-shingles-part7-61", title: "Asphalt Composition Shingles, Part 7", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part7-61.htm", tags: "asphalt asphalt composition shingles, part 7" },
      { id: "asphalt-comp-shingles-part8-62", title: "Asphalt Composition Shingles, Part 8", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part8-62.htm", tags: "asphalt asphalt composition shingles, part 8" },
      { id: "asphalt-comp-shingles-part9-63", title: "Asphalt Composition Shingles, Part 9", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part9-63.htm", tags: "asphalt asphalt composition shingles, part 9" },
      { id: "asphalt-comp-shingles-part10-64", title: "Asphalt Composition Shingles, Part 10", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part10-64.htm", tags: "asphalt asphalt composition shingles, part 10" },
      { id: "asphalt-comp-shingles-part11-65", title: "Asphalt Composition Shingles, Part 11", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part11-65.htm", tags: "asphalt asphalt composition shingles, part 11" },
      { id: "asphalt-comp-shingles-part12-66", title: "Asphalt Composition Shingles, Part 12", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part12-66.htm", tags: "asphalt asphalt composition shingles, part 12" },
      { id: "asphalt-comp-shingles-part13-67", title: "Asphalt Composition Shingles, Part 13", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part13-67.htm", tags: "asphalt asphalt composition shingles, part 13" },
      { id: "asphalt-comp-shingles-part14-68", title: "Asphalt Composition Shingles, Part 14", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part14-68.htm", tags: "asphalt asphalt composition shingles, part 14" },
      { id: "asphalt-comp-shingles-part15-69", title: "Asphalt Composition Shingles, Part 15", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part15-69.htm", tags: "asphalt asphalt composition shingles, part 15" },
      { id: "asphalt-comp-shingles-part16-70", title: "Asphalt Composition Shingles, Part 16", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part16-70.htm", tags: "asphalt asphalt composition shingles, part 16" },
      { id: "asphalt-comp-shingles-part17-71", title: "Asphalt Composition Shingles, Part 17", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part17-71.htm", tags: "asphalt asphalt composition shingles, part 17" },
      { id: "asphalt-comp-shingles-part18-72", title: "Asphalt Composition Shingles, Part 18", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part18-72.htm", tags: "asphalt asphalt composition shingles, part 18" },
      { id: "asphalt-comp-shingles-part19-73", title: "Asphalt Composition Shingles, Part 19", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part19-73.htm", tags: "asphalt asphalt composition shingles, part 19" },
      { id: "asphalt-comp-shingles-part20-74", title: "Asphalt Composition Shingles, Part 20", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part20-74.htm", tags: "asphalt asphalt composition shingles, part 20" },
      { id: "asphalt-comp-shingles-part21-75", title: "Asphalt Composition Shingles, Part 21", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part21-75.htm", tags: "asphalt asphalt composition shingles, part 21" },
      { id: "asphalt-comp-shingles-part22-76", title: "Asphalt Composition Shingles, Part 22", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part22-76.htm", tags: "asphalt asphalt composition shingles, part 22" },
      { id: "asphalt-comp-shingles-part23-77", title: "Asphalt Composition Shingles, Part 23", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part23-77.htm", tags: "asphalt asphalt composition shingles, part 23" },
      { id: "asphalt-comp-shingles-part24-78", title: "Asphalt Composition Shingles, Part 24", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part24-78.htm", tags: "asphalt asphalt composition shingles, part 24" },
      { id: "asphalt-comp-shingles-part25-79", title: "Fasteners", look: "High nails, missing nails, overdriven, racking. High-wind pattern vs four nails in a calm zone.", url: "https://www.nachi.org/asphalt-comp-shingles-part25-79.htm", tags: "fasteners nails high-nail racking" },
      { id: "asphalt-comp-shingles-part26-80", title: "Asphalt Composition Shingles, Part 26", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part26-80.htm", tags: "asphalt asphalt composition shingles, part 26" },
      { id: "asphalt-comp-shingles-part27-81", title: "Asphalt Composition Shingles, Part 27", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part27-81.htm", tags: "asphalt asphalt composition shingles, part 27" },
      { id: "asphalt-comp-shingles-part28-82", title: "How many layers?", look: "Feel the butts. Two layers, weight on the deck, drip edge buried. We tear off. Always.", url: "https://www.nachi.org/asphalt-comp-shingles-part28-82.htm", tags: "reroof layers tear-off plywood weight" },
      { id: "asphalt-comp-shingles-part29-83", title: "Asphalt Composition Shingles, Part 29", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part29-83.htm", tags: "asphalt asphalt composition shingles, part 29" },
      { id: "asphalt-comp-shingles-part30-84", title: "Worn out vs hit", look: "Even granule loss, cupping, splitting from age. Storm is random. Wear is the whole field looking tired.", url: "https://www.nachi.org/asphalt-comp-shingles-part30-84.htm", tags: "weathering lifespan granule loss cupping" },
      { id: "asphalt-comp-shingles-part31-85", title: "Asphalt Composition Shingles, Part 31", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part31-85.htm", tags: "asphalt asphalt composition shingles, part 31" },
      { id: "asphalt-comp-shingles-part32-86", title: "Asphalt Composition Shingles, Part 32", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part32-86.htm", tags: "asphalt asphalt composition shingles, part 32" },
      { id: "asphalt-comp-shingle-part33-87", title: "Asphalt Composition Shingles, Part 33", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingle-part33-87.htm", tags: "asphalt asphalt composition shingles, part 33" },
      { id: "asphalt-comp-shingles-part34-88", title: "Asphalt Composition Shingles, Part 34", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part34-88.htm", tags: "asphalt asphalt composition shingles, part 34" },
      { id: "asphalt-comp-shingles-part35-89", title: "Defects vs damage", look: "Blisters, color variation, tobacco juicing, mechanical gouges. Don’t call a manufacturing miss hail.", url: "https://www.nachi.org/asphalt-comp-shingles-part35-89.htm", tags: "defect blister algae moss mechanical" },
      { id: "asphalt-comp-shingles-part36-90", title: "Asphalt Composition Shingles, Part 36", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part36-90.htm", tags: "asphalt asphalt composition shingles, part 36" },
      { id: "asphalt-comp-shingles-part37-91", title: "Asphalt Composition Shingles, Part 37", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part37-91.htm", tags: "asphalt asphalt composition shingles, part 37" },
      { id: "asphalt-comp-shingles-part38-92", title: "Asphalt Composition Shingles, Part 38", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part38-92.htm", tags: "asphalt asphalt composition shingles, part 38" },
      { id: "asphalt-comp-shingles-part39-93", title: "Asphalt Composition Shingles, Part 39", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part39-93.htm", tags: "asphalt asphalt composition shingles, part 39" },
      { id: "asphalt-comp-shingles-part40-94", title: "Asphalt Composition Shingles, Part 40", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part40-94.htm", tags: "asphalt asphalt composition shingles, part 40" },
      { id: "asphalt-comp-shingles-part41-95", title: "Asphalt Composition Shingles, Part 41", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part41-95.htm", tags: "asphalt asphalt composition shingles, part 41" },
      { id: "asphalt-comp-shingles-part42-96", title: "Asphalt Composition Shingles, Part 42", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part42-96.htm", tags: "asphalt asphalt composition shingles, part 42" },
      { id: "asphalt-comp-shingles-part43-97", title: "Asphalt Composition Shingles, Part 43", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part43-97.htm", tags: "asphalt asphalt composition shingles, part 43" },
      { id: "asphalt-comp-shingles-part44-98", title: "Mat, asphalt, granules", look: "Lift a bruise. Exposed mat or cracked asphalt is the story. Granule loss alone is not a roof.", url: "https://www.nachi.org/asphalt-comp-shingles-part44-98.htm", tags: "hail mat asphalt granule duration" },
      { id: "asphalt-comp-shingles-part45-99", title: "Asphalt Composition Shingles, Part 45", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part45-99.htm", tags: "asphalt asphalt composition shingles, part 45" },
      { id: "asphalt-comp-shingles-part46-100", title: "Asphalt Composition Shingles, Part 46", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part46-100.htm", tags: "asphalt asphalt composition shingles, part 46" },
      { id: "asphalt-comp-shingles-part47-101", title: "Asphalt Composition Shingles, Part 47", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part47-101.htm", tags: "asphalt asphalt composition shingles, part 47" },
      { id: "asphalt-comp-shingles-part48-102", title: "Asphalt Composition Shingles, Part 48", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part48-102.htm", tags: "asphalt asphalt composition shingles, part 48" },
      { id: "asphalt-comp-shingles-part49-103", title: "Asphalt Composition Shingles, Part 49", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part49-103.htm", tags: "asphalt asphalt composition shingles, part 49" },
      { id: "asphalt-comp-shingles-part50-104", title: "Seal strip", look: "Cold install, dirty adhesive, or age. Hand-seal talk is for the adjuster, not the porch.", url: "https://www.nachi.org/asphalt-comp-shingles-part50-104.htm", tags: "wind adhesive seal strip fasteners" },
      { id: "asphalt-comp-shingles-part51-105", title: "Asphalt Composition Shingles, Part 51", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part51-105.htm", tags: "asphalt asphalt composition shingles, part 51" },
      { id: "asphalt-comp-shingles-part52-106", title: "Asphalt Composition Shingles, Part 52", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part52-106.htm", tags: "asphalt asphalt composition shingles, part 52" },
      { id: "asphalt-comp-shingles-part53-107", title: "Asphalt Composition Shingles, Part 53", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part53-107.htm", tags: "asphalt asphalt composition shingles, part 53" },
      { id: "asphalt-comp-shingles-part54-108", title: "Asphalt Composition Shingles, Part 54", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part54-108.htm", tags: "asphalt asphalt composition shingles, part 54" },
      { id: "asphalt-comp-shingles-part55-109", title: "Asphalt Composition Shingles, Part 55", look: "What shingle is this, how old, how many layers, nails, wear vs a hit.", url: "https://www.nachi.org/asphalt-comp-shingles-part55-109.htm", tags: "asphalt asphalt composition shingles, part 55" },
    ],
  },
  {
    id: "flash",
    title: "Flashings",
    when: "Kickout, step, counter, valleys.",
    cards: [
      { id: "flashing-part1-12", title: "Step, kickout, counter", look: "Sidewall without kickout rots the corner. Headwall missing counter-flashing. That’s the leak they ‘never had.’", url: "https://www.nachi.org/flashing-part1-12.htm", tags: "flashing kickout sidewall headwall counter" },
      { id: "flashing-part2-13", title: "Flashing, Part 2", look: "Kickout, step, counter, valleys. The leak they ‘never had.’", url: "https://www.nachi.org/flashing-part2-13.htm", tags: "flash flashing, part 2" },
      { id: "flashing-part3-14", title: "Flashing, Part 3", look: "Kickout, step, counter, valleys. The leak they ‘never had.’", url: "https://www.nachi.org/flashing-part3-14.htm", tags: "flash flashing, part 3" },
      { id: "flashing-part4-15", title: "Flashing, Part 4", look: "Kickout, step, counter, valleys. The leak they ‘never had.’", url: "https://www.nachi.org/flashing-part4-15.htm", tags: "flash flashing, part 4" },
      { id: "flashing-part5-16", title: "Valleys", look: "Open metal vs closed cut. Pinched, rusty, or shingled over. Water volume is highest here.", url: "https://www.nachi.org/flashing-part5-16.htm", tags: "valley open closed woven" },
      { id: "flashing-part6-17", title: "Flashing, Part 6", look: "Kickout, step, counter, valleys. The leak they ‘never had.’", url: "https://www.nachi.org/flashing-part6-17.htm", tags: "flash flashing, part 6" },
    ],
  },
  {
    id: "pipes",
    title: "Penetrations",
    when: "Pipes, boots, chimneys, skylights.",
    cards: [
      { id: "roof-penetrations-part1-18", title: "Pipes, boots, skylights", look: "Cracked boots, pitch pans, dead skylight flashings. Cheap to point at, expensive if you miss.", url: "https://www.nachi.org/roof-penetrations-part1-18.htm", tags: "boot pipe penetration skylight chimney" },
      { id: "roof-penetrations-part2-19", title: "Roof Penetrations, Part 2", look: "Boots, chimneys, skylights, pitch pans. Cheap to point at, expensive if you miss.", url: "https://www.nachi.org/roof-penetrations-part2-19.htm", tags: "pipes roof penetrations, part 2" },
      { id: "roof-penetrations-part3-20", title: "Roof Penetrations, Part 3", look: "Boots, chimneys, skylights, pitch pans. Cheap to point at, expensive if you miss.", url: "https://www.nachi.org/roof-penetrations-part3-20.htm", tags: "pipes roof penetrations, part 3" },
      { id: "roof-penetrations-part4-21", title: "Roof Penetrations, Part 4", look: "Boots, chimneys, skylights, pitch pans. Cheap to point at, expensive if you miss.", url: "https://www.nachi.org/roof-penetrations-part4-21.htm", tags: "pipes roof penetrations, part 4" },
      { id: "roof-penetrations-part5-22", title: "Roof Penetrations, Part 5", look: "Boots, chimneys, skylights, pitch pans. Cheap to point at, expensive if you miss.", url: "https://www.nachi.org/roof-penetrations-part5-22.htm", tags: "pipes roof penetrations, part 5" },
    ],
  },
  {
    id: "drain",
    title: "Drainage",
    when: "Drip edge, gutters, ice dams.",
    cards: [
      { id: "roof-drainage-systems-part1-23", title: "Drip edge and gutters", look: "No drip edge, gutters pulling fascia, ice dam line at the eave. Drainage is the roof’s overflow.", url: "https://www.nachi.org/roof-drainage-systems-part1-23.htm", tags: "drip-edge gutter ice dam drainage eave" },
      { id: "roof-drainage-systems-part2-24", title: "Roof Drainage Systems, Part 2", look: "Drip edge, gutters, ice dams. Drainage is the roof’s overflow.", url: "https://www.nachi.org/roof-drainage-systems-part2-24.htm", tags: "drain roof drainage systems, part 2" },
    ],
  },
  {
    id: "under",
    title: "Underlayment",
    when: "What’s under the shingle.",
    cards: [
      { id: "underlayment-part1-7", title: "What’s under the shingle", look: "Felt vs synthetic vs ice-and-water in valleys and eaves. You see it at a blow-off or in the attic stain.", url: "https://www.nachi.org/underlayment-part1-7.htm", tags: "underlayment ice-and-water felt synthetic" },
      { id: "underlayment-part2-8", title: "Underlayment, Part 2", look: "Felt vs synthetic vs ice-and-water in valleys and eaves.", url: "https://www.nachi.org/underlayment-part2-8.htm", tags: "under underlayment, part 2" },
      { id: "underlayment-part3-9", title: "Underlayment, Part 3", look: "Felt vs synthetic vs ice-and-water in valleys and eaves.", url: "https://www.nachi.org/underlayment-part3-9.htm", tags: "under underlayment, part 3" },
      { id: "underlayment-part4-10", title: "Underlayment, Part 4", look: "Felt vs synthetic vs ice-and-water in valleys and eaves.", url: "https://www.nachi.org/underlayment-part4-10.htm", tags: "under underlayment, part 4" },
      { id: "underlayment-part5-11", title: "Underlayment, Part 5", look: "Felt vs synthetic vs ice-and-water in valleys and eaves.", url: "https://www.nachi.org/underlayment-part5-11.htm", tags: "under underlayment, part 5" },
    ],
  },
  {
    id: "attic",
    title: "Inside the attic",
    when: "Stains, ventilation, and moisture that isn’t a leak.",
    cards: [
      { id: "attic-area-5", title: "What the attic shows", look: "Stains, shiny nails, daylight, wet sheathing, mold at the north slope. Photograph it.", url: "https://www.nachi.org/attic-area-5.htm", tags: "attic sheathing stain daylight moisture" },
      { id: "attic-ventilation-systems-part1-25", title: "Does it breathe?", look: "Soffit intake + ridge exhaust. Boxed soffits, painted-shut vents, a bath fan dumping into the attic.", url: "https://www.nachi.org/attic-ventilation-systems-part1-25.htm", tags: "ventilation ridge soffit intake exhaust" },
      { id: "attic-ventilation-systems-part2-26", title: "Attic Ventilation Systems, Part 2", look: "Stains, ventilation, moisture that is not a leak. Photograph it.", url: "https://www.nachi.org/attic-ventilation-systems-part2-26.htm", tags: "attic attic ventilation systems, part 2" },
      { id: "attic-ventilation-systems-part3-27", title: "Attic Ventilation Systems, Part 3", look: "Stains, ventilation, moisture that is not a leak. Photograph it.", url: "https://www.nachi.org/attic-ventilation-systems-part3-27.htm", tags: "attic attic ventilation systems, part 3" },
      { id: "moisture-problems-6", title: "Moisture that isn’t a leak", look: "Condensation, ice dams, humidity from the house. Don’t promise a new roof will fix a bath fan.", url: "https://www.nachi.org/moisture-problems-6.htm", tags: "moisture condensation ice dam humidity" },
    ],
  },
  {
    id: "metal",
    title: "Metal",
    when: "Dents, fasteners, and rust.",
    cards: [
      { id: "metal-roofs-part1-110", title: "Metal", look: "Oil-canning, fastener back-out, rust at cuts, sealant failure at laps. Hail on metal is a dent story — different standard.", url: "https://www.nachi.org/metal-roofs-part1-110.htm", tags: "metal standing-seam screw rust" },
      { id: "metal-roofs-part2-111", title: "Metal Roofs, Part 2", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part2-111.htm", tags: "metal metal roofs, part 2" },
      { id: "metal-roofs-part3-112", title: "Metal Roofs, Part 3", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part3-112.htm", tags: "metal metal roofs, part 3" },
      { id: "metal-roofs-part4-113", title: "Metal Roofs, Part 4", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part4-113.htm", tags: "metal metal roofs, part 4" },
      { id: "metal-roofs-part5-114", title: "Metal Roofs, Part 5", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part5-114.htm", tags: "metal metal roofs, part 5" },
      { id: "metal-roofs-part6-115", title: "Metal Roofs, Part 6", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part6-115.htm", tags: "metal metal roofs, part 6" },
      { id: "metal-roofs-part7-116", title: "Metal Roofs, Part 7", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part7-116.htm", tags: "metal metal roofs, part 7" },
      { id: "metal-roofs-part8-117", title: "Metal Roofs, Part 8", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part8-117.htm", tags: "metal metal roofs, part 8" },
      { id: "metal-roofs-part9-118", title: "Metal Roofs, Part 9", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part9-118.htm", tags: "metal metal roofs, part 9" },
      { id: "metal-roofs-part10-119", title: "Metal Roofs, Part 10", look: "Oil-canning, fastener back-out, rust, hail dents. Different standard than shingles.", url: "https://www.nachi.org/metal-roofs-part10-119.htm", tags: "metal metal roofs, part 10" },
    ],
  },
  {
    id: "tile",
    title: "Tile",
    when: "Walk the pans, not the barrels.",
    cards: [
      { id: "tile-roofs-part1-140", title: "Tile", look: "Cracked tiles, slipped courses, broken bird stops. Walk the pans, not the barrels, or stay off.", url: "https://www.nachi.org/tile-roofs-part1-140.htm", tags: "tile clay concrete" },
      { id: "tile-roofs-part2-141", title: "Tile Roofs, Part 2", look: "Cracked tiles, slipped courses, bird stops. Walk the pans, not the barrels.", url: "https://www.nachi.org/tile-roofs-part2-141.htm", tags: "tile tile roofs, part 2" },
      { id: "tile-roofs-part3-142", title: "Tile Roofs, Part 3", look: "Cracked tiles, slipped courses, bird stops. Walk the pans, not the barrels.", url: "https://www.nachi.org/tile-roofs-part3-142.htm", tags: "tile tile roofs, part 3" },
      { id: "tile-roofs-part4-143", title: "Tile Roofs, Part 4", look: "Cracked tiles, slipped courses, bird stops. Walk the pans, not the barrels.", url: "https://www.nachi.org/tile-roofs-part4-143.htm", tags: "tile tile roofs, part 4" },
      { id: "tile-roofs-part5-144", title: "Tile Roofs, Part 5", look: "Cracked tiles, slipped courses, bird stops. Walk the pans, not the barrels.", url: "https://www.nachi.org/tile-roofs-part5-144.htm", tags: "tile tile roofs, part 5" },
      { id: "tile-roofs-part6-145", title: "Tile Roofs, Part 6", look: "Cracked tiles, slipped courses, bird stops. Walk the pans, not the barrels.", url: "https://www.nachi.org/tile-roofs-part6-145.htm", tags: "tile tile roofs, part 6" },
    ],
  },
  {
    id: "slate",
    title: "Slate",
    when: "One broken slate is not a roof.",
    cards: [
      { id: "slate-roofs-part1-120", title: "Slate", look: "Delam, broken nails, previous face-nail repairs. One broken slate is not a roof. A pattern is.", url: "https://www.nachi.org/slate-roofs-part1-120.htm", tags: "slate vinyl-slate" },
      { id: "slate-roofs-part2-121", title: "Slate Roofs, Part 2", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part2-121.htm", tags: "slate slate roofs, part 2" },
      { id: "slate-roofs-part3-122", title: "Slate Roofs, Part 3", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part3-122.htm", tags: "slate slate roofs, part 3" },
      { id: "slate-roofs-part4-123", title: "Slate Roofs, Part 4", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part4-123.htm", tags: "slate slate roofs, part 4" },
      { id: "slate-roofs-part5-124", title: "Slate Roofs, Part 5", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part5-124.htm", tags: "slate slate roofs, part 5" },
      { id: "slate-roofs-part6-125", title: "Slate Roofs, Part 6", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part6-125.htm", tags: "slate slate roofs, part 6" },
      { id: "slate-roofs-part7-126", title: "Slate Roofs, Part 7", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part7-126.htm", tags: "slate slate roofs, part 7" },
      { id: "slate-roofs-part8-127", title: "Slate Roofs, Part 8", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part8-127.htm", tags: "slate slate roofs, part 8" },
      { id: "slate-roofs-part9-128", title: "Slate Roofs, Part 9", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part9-128.htm", tags: "slate slate roofs, part 9" },
      { id: "slate-roofs-part10-129", title: "Slate Roofs, Part 10", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part10-129.htm", tags: "slate slate roofs, part 10" },
      { id: "slate-roofs-part11-130", title: "Slate Roofs, Part 11", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part11-130.htm", tags: "slate slate roofs, part 11" },
      { id: "slate-roofs-part12-131", title: "Slate Roofs, Part 12", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part12-131.htm", tags: "slate slate roofs, part 12" },
      { id: "slate-roofs-part13-132", title: "Slate Roofs, Part 13", look: "Delam, broken nails, face-nail repairs. One broken slate is not a roof.", url: "https://www.nachi.org/slate-roofs-part13-132.htm", tags: "slate slate roofs, part 13" },
    ],
  },
  {
    id: "wood",
    title: "Wood",
    when: "Cupping, rot, moss, fire.",
    cards: [
      { id: "wood-shakes-shingles-part1-133", title: "Wood shakes", look: "Cupping, rot, moss holding water, missing felt. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part1-133.htm", tags: "shake shingle wood cedar" },
      { id: "wood-shakes-shingles-part2-134", title: "Wood Shakes and Shingles, Part 2", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part2-134.htm", tags: "wood wood shakes and shingles, part 2" },
      { id: "wood-shakes-shingles-part3-135", title: "Wood Shakes and Shingles, Part 3", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part3-135.htm", tags: "wood wood shakes and shingles, part 3" },
      { id: "wood-shakes-shingles-part4-136", title: "Wood Shakes and Shingles, Part 4", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part4-136.htm", tags: "wood wood shakes and shingles, part 4" },
      { id: "wood-shakes-shingles-part5-137", title: "Wood Shakes and Shingles, Part 5", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part5-137.htm", tags: "wood wood shakes and shingles, part 5" },
      { id: "wood-shakes-shingles-part6-138", title: "Wood Shakes and Shingles, Part 6", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part6-138.htm", tags: "wood wood shakes and shingles, part 6" },
      { id: "wood-shakes-shingles-part7-139", title: "Wood Shakes and Shingles, Part 7", look: "Cupping, rot, moss holding water. Fire and wear, not just hail.", url: "https://www.nachi.org/wood-shakes-shingles-part7-139.htm", tags: "wood wood shakes and shingles, part 7" },
    ],
  },
];

export const MRI_COUNT = MRI_CHAPTERS.reduce((n, ch) => n + ch.cards.length, 0);

export function mriSearchHay(chapter: MriChapter, card: MriCard) {
  return `${chapter.title} ${chapter.when} ${card.title} ${card.look} ${card.tags}`.toLowerCase();
}

/** Named cards the coach may cite. Reference page still lists every chapter. */
export const COACH_MRI = [
  { id: "mri-ppe-51", title: "Fall protection" },
  { id: "mri-photography-54", title: "Photo order" },
  { id: "hail-damage-part1-28", title: "What a hit looks like" },
  { id: "hail-damage-part2-29", title: "Is it functional?" },
  { id: "hail-damage-part5-32", title: "Storm came from one side" },
  { id: "wind-damage-part1-40", title: "Blow-off vs a crease" },
  { id: "asphalt-comp-shingles-part1-55", title: "What is actually on here?" },
  { id: "asphalt-comp-shingles-part25-79", title: "Fasteners" },
  { id: "asphalt-comp-shingles-part28-82", title: "How many layers?" },
  { id: "asphalt-comp-shingles-part30-84", title: "Worn out vs hit" },
  { id: "flashing-part1-12", title: "Step, kickout, counter" },
  { id: "flashing-part5-16", title: "Valleys" },
  { id: "roof-penetrations-part1-18", title: "Pipes, boots, skylights" },
  { id: "attic-area-5", title: "What the attic shows" },
] as const;

const SHOT_MRI_TITLES = new Set([
  "Fall protection",
  "Photo order",
  "What a hit looks like",
  "Is it functional?",
  "Storm came from one side",
  "Blow-off vs a crease",
  "What is actually on here?",
  "Fasteners",
  "How many layers?",
  "Worn out vs hit",
]);

type NamedCard = { chapter: string; card: MriCard };

function resolveNamed(want: { id: string; title: string }): NamedCard | null {
  for (const ch of MRI_CHAPTERS) {
    const hit = ch.cards.find((c) => c.id === want.id);
    if (hit) return { chapter: ch.title, card: hit };
  }
  for (const ch of MRI_CHAPTERS) {
    const hit = ch.cards.find((c) => c.title === want.title);
    if (hit) return { chapter: ch.title, card: hit };
  }
  return null;
}

function namedCards(only?: Set<string>): NamedCard[] {
  const out: NamedCard[] = [];
  const seenLook = new Set<string>();
  for (const want of COACH_MRI) {
    const row = resolveNamed(want);
    if (!row) continue;
    if (only && !only.has(row.card.title)) continue;
    if (seenLook.has(row.card.look)) continue;
    seenLook.add(row.card.look);
    out.push(row);
  }
  return out;
}

function formatNamed(rows: NamedCard[]): string {
  return rows
    .map(({ chapter, card }) => `### ${chapter} — ${card.title}\n${card.look}\nOpen Reference: ${card.title}`)
    .join("\n\n");
}

export function inspectKnowledge(): string {
  return formatNamed(namedCards());
}

/** Photo turns: hail / wind / wear subset of the named cards. Not the catalog. */
export function inspectKnowledgeForShot(): string {
  return formatNamed(namedCards(SHOT_MRI_TITLES));
}



