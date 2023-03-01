import React from 'react'

import { DydxLogo } from './DydxLogo'
import { GammaXLogo } from './GammaXLogo'
import { MyriaLogo } from './MyriaLogo'

interface ProjectLogoProps {
  projectName: 'dYdX' | 'Myria' | 'GammaX'
}

export function ProjectLogo({ projectName }: ProjectLogoProps) {
  const ProjectLogoComponent = getProjectLogoComponent(projectName)
  return <ProjectLogoComponent className="h-[26px] sm:h-8" />
}

function getProjectLogoComponent(projectName: 'dYdX' | 'Myria' | 'GammaX') {
  switch (projectName) {
    case 'dYdX':
      return DydxLogo
    case 'GammaX':
      return GammaXLogo
    case 'Myria':
      return MyriaLogo
  }
}
