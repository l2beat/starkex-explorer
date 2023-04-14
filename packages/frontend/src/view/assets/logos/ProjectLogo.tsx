import { InstanceName } from '@explorer/shared'
import React from 'react'

import { DydxLogo } from './DydxLogo'
import { GammaXLogo } from './GammaXLogo'
import { MyriaLogo } from './MyriaLogo'

interface ProjectLogoProps {
  instanceName: InstanceName
}

export function ProjectLogo({ instanceName }: ProjectLogoProps) {
  const ProjectLogoComponent = getProjectLogoComponent(instanceName)
  return <ProjectLogoComponent className="h-[26px] sm:h-8" />
}

function getProjectLogoComponent(instanceName: InstanceName) {
  switch (instanceName) {
    case 'dYdX':
      return DydxLogo
    case 'GammaX':
      return GammaXLogo
    case 'Myria':
      return MyriaLogo
  }
}
