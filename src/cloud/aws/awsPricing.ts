import type { ArchitectureNodeData, ResourceType } from '../../types';

type Props=Record<string,string|number|boolean>;
const n=(v:unknown,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const s=(v:unknown,fallback='')=>String(v??fallback);

const HOURS=730;

const ec2Hourly:Record<string,number>={
  't3.micro':0.012,
  't3.small':0.024,
  't3.medium':0.048,
  'm6i.large':0.11,
  'm6i.xlarge':0.22,
  'c6i.large':0.10,
  'r6i.large':0.14,
};

const rdsHourly:Record<string,number>={
  'db.t4g.micro':0.02,
  'db.t4g.small':0.04,
  'db.m6g.large':0.18,
  'db.r6g.large':0.22,
  'db.t4g.medium':0.08,
  'db.r7g.large':0.25,
};

export const awsCostCategory=(type:ResourceType|string)=>{
  const t=String(type);
  if(['awsEc2','awsEc2AutoScaling','awsLambda','awsElasticBeanstalk'].includes(t))return'Compute';
  if(['awsEcs','awsEks','awsEcr','awsFargate'].includes(t))return'Containers';
  if(['awsS3','awsEbs','awsBackup'].includes(t))return'Storage';
  if(['awsRds','awsAurora','awsDynamoDb'].includes(t))return'Database';
  if(['awsVpc','awsSubnet','awsTransitGateway','awsDirectConnect','awsSiteToSiteVpn','awsCloudFront','awsRoute53','awsAlb','awsNlb','awsPrivateLink','awsApiGateway','awsNetworkFirewall'].includes(t))return'Networking';
  if(['awsKms','awsSecretsManager','awsSecurityHub'].includes(t))return'Security';
  if(['awsCloudWatch','awsCloudTrail'].includes(t))return'Monitoring';
  if(['awsSqs','awsSns','awsEventBridge','awsStepFunctions'].includes(t))return'Integration';
  return'Other';
};

export const estimateAwsMonthlyCost=(data:ArchitectureNodeData)=>{
  const t=String(data.resourceType);
  const p=(data.properties||{}) as Props;

  if(t==='awsEc2'){
    const hourly=ec2Hourly[s(p.instanceType,'t3.micro')]??0.05;
    const diskGb=n(p.rootVolumeSize,30);
    const diskType=s(p.rootVolumeType,'gp3');
    const diskRate=diskType==='io2'?0.125:diskType==='st1'?0.045:0.08;
    return hourly*HOURS + diskGb*diskRate;
  }
  if(t==='awsEc2AutoScaling'){
    const desired=n(p.desiredCapacity,2);
    return desired*0.05*HOURS;
  }
  if(t==='awsLambda'){
    const memoryGb=n(p.memorySize,512)/1024;
    const seconds=n(p.timeout,30);
    const invocations=n(p.monthlyInvocations,100000);
    return Math.max(0.2,invocations*seconds*memoryGb*0.0000167 + invocations/1_000_000*0.20);
  }
  if(t==='awsElasticBeanstalk')return 0; // service itself has no separate platform charge; underlying resources drive cost.
  if(t==='awsEcs')return s(p.capacityProvider,'FARGATE')==='EC2'?0:36;
  if(t==='awsEks')return 73;
  if(t==='awsEcr')return n(p.storageGb,20)*0.10;
  if(t==='awsFargate'){
    const cpu=n(p.cpu,512)/1024;
    const mem=n(p.memory,1024)/1024;
    return HOURS*(cpu*0.04+mem*0.0045);
  }
  if(t==='awsS3'){
    const gb=n(p.storageGb,100);
    return gb*0.025 + 1;
  }
  if(t==='awsEbs'){
    const gb=n(p.sizeGiB,100);
    const volume=s(p.volumeType,'gp3');
    const rate=volume==='io2'?0.125:volume==='st1'?0.045:volume==='sc1'?0.025:0.08;
    return gb*rate;
  }
  if(t==='awsBackup')return n(p.protectedStorageGb,100)*0.05;
  if(t==='awsRds'){
    const hourly=rdsHourly[s(p.instanceClass,'db.t4g.micro')]??0.10;
    const storage=n(p.allocatedStorage,100)*0.115;
    return hourly*HOURS*(p.multiAz===true?2:1)+storage;
  }
  if(t==='awsAurora'){
    const hourly=rdsHourly[s(p.instanceClass,'db.r6g.large')]??0.22;
    const instances=n(p.instances,2);
    return hourly*HOURS*instances + 25;
  }
  if(t==='awsDynamoDb')return s(p.billingMode,'PAY_PER_REQUEST')==='PROVISIONED'?35:10;
  if(t==='awsTransitGateway')return 40;
  if(t==='awsDirectConnect')return 150;
  if(t==='awsSiteToSiteVpn')return 40;
  if(t==='awsCloudFront')return n(p.monthlyDataTransferGb,100)*0.09;
  if(t==='awsRoute53')return 1;
  if(t==='awsAlb')return 20;
  if(t==='awsNlb')return 20;
  if(t==='awsPrivateLink')return 8;
  if(t==='awsApiGateway')return 5;
  if(t==='awsNetworkFirewall')return 300;
  if(t==='awsKms')return 1;
  if(t==='awsSecretsManager')return 1;
  if(t==='awsSecurityHub')return 10;
  if(t==='awsCloudWatch')return 10;
  if(t==='awsCloudTrail')return 5;
  if(t==='awsSqs'||t==='awsSns'||t==='awsEventBridge')return 2;
  if(t==='awsStepFunctions')return 5;
  if(t==='awsVpc'||t==='awsSubnet'||t==='awsAccount'||t==='awsCloudFormation')return 0;
  return 0;
};

export const AWS_PRICING_MODEL='Architecture estimate';
export const AWS_PRICING_API='AWS Price List API (GetProducts)';
