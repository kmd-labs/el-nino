/** People on the "About us" page; bios and task chips live in `Dict.about.people` in the same order. */
export interface TeamMember {
  firstName: string;
  lastName: string;
  /** null until a photo is supplied; the page shows a placeholder instead */
  photo: string | null;
  linkedin: string;
  github?: string;
}

export const TEAM: TeamMember[] = [
  {
    firstName: 'Adrian',
    lastName: 'Kulik',
    photo: 'assets/team/adrian-kulik.jpg',
    linkedin: 'https://www.linkedin.com/in/adrian-kulik',
    github: 'https://github.com/adriankulik'
  },
  {
    firstName: 'Leszek',
    lastName: 'Michalak',
    photo: 'assets/team/leszek-michalak.jpg',
    linkedin: 'https://www.linkedin.com/in/leszek-michalak-422745b6/'
  },
  {
    firstName: 'Marcin',
    lastName: 'Derewońko',
    photo: 'assets/team/marcin-derewonko.jpg',
    linkedin: 'https://linkedin.com/in/mmder'
  }
];
